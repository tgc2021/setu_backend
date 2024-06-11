// suborganisationRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = require('sequelize');

// Create a new suborganisation
router.post('/create', async (req, res) => {
  try {
    const requiredFields = ['name','OrganisationId','email','password','authByEmail','authByPhone'];

    // Check for missing fields
    const missingFields = requiredFields.filter(field => req.body[field]==undefined);
  
    if (missingFields.length > 0) {
        return res.status(400).json({ message: `The following fields are missing: ${missingFields.join(', ')}` });
    }

    const organisation = await db.Organisation.findByPk(req.body.OrganisationId);
    if (organisation === null) {
      res.status(404).json({type:'error', message: 'Organisation not found' });
    } 
    const createData={
        name:req.body.name,
        isActive:req.body?.isActive,
        OrganisationId:req.body.OrganisationId,
        email:req.body.email,
        password:req.body.password,
        authByEmail:req.body.authByEmail,
        authByPhone:req.body.authByPhone
    }
    const suborganisation = await db.Suborganisation.create(createData);
    res.status(201).json({message:'Suborganisation created successfully.',suborganisation})
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read all suborganisations
router.get('/getAll/:organisationId', async (req, res) => {
    try {
      const suborganisations = await db.Suborganisation.findAll({
        where: {
          OrganisationId: req.params.organisationId
        }
      });
      res.json(suborganisations);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

// Read a suborganisation by ID
router.get('/check', async (req, res) => {

  try {
    console.log('orgId',req.query.id)
    const suborganisation = await db.Suborganisation.findByPk(req.query.id);
    
    if (suborganisation === null) {
      res.status(404).json({ type:'error',message: 'Organisation/Suborganisation not found' });
    }
     else {
      
      const organisation= await db.Organisation.findByPk(suborganisation.OrganisationId);
      if (organisation === null) {
       return  res.status(404).json({ type:'error',message: 'Organisation/Suborganisation not found' });
      }

      if(  suborganisation && suborganisation.isActive==0 || organisation && organisation.isActive==0   ){
        return res.status(404).json({ type:'error',message: 'Organisation/Suborganisation is not active!' });
      }

   

      const configuredAuth=(suborganisation.authByEmail && suborganisation.authByPhone)?'Both':
      suborganisation.authByEmail?"Email":suborganisation.authByPhone?"Phone":null;
      res.json({id:suborganisation.id, configuredAuth});
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a suborganisation by ID
router.patch('/update/:id', async (req, res) => {
  try {
    const suborganisation = await db.Suborganisation.findByPk(req.params.id);
    if (suborganisation === null) {
      res.status(404).json({ message: 'Suborganisation not found' });
    } else {
        const {name,isActive,organisationId,email,password,authByEmail,authByPhone}=req.body;
        const updateData={
          name:name,
          isActive:isActive,
          OrganisationId:organisationId,
          email:email,
          password:password,
          authByEmail,
          authByPhone
          
        }
        if(!name && !isActive  && !organisationId  && !email && !password &&  authByEmail==undefined && authByPhone==undefined){
          return res.status(400).json({ message: `Nothing to update..!` });
        }
      await suborganisation.update(updateData);
      res.json(suborganisation);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a suborganisation by ID
router.delete('/delete', async (req, res) => {
  try {
    const suborganisation = await db.Suborganisation.findByPk(req.query.id);
    if (suborganisation === null) {
      res.status(404).json({ message: 'Suborganisation not found' });
    } else {
      await suborganisation.destroy();
      res.json({ message: 'Suborganisation deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Create ValueBuddy Questions
router.post('/addValuebuddyQuestions', async (req, res) => {
  try {
      const questions = req.body.questions;
      const suborganisationId=req.body.suborgId;



      if(!suborganisationId)
        return res.status(400).json({ message: 'suborgId is missing.' });

      // Check if questions array has exactly 16 elements
      if (!Array.isArray(questions) || questions.length !== 16) {
          return res.status(400).json({ message: 'Expected 16 questions.' });
      }

      // Check if all questions are unique
      const uniqueQuestions = new Set(questions.map(q => q.question));
      if (uniqueQuestions.size !== questions.length) {
          return res.status(400).json({ message: 'All questions must be unique.' });
      }

      // Check if all options within each question are unique
      for (const q of questions) {
        if(!q.question)
          return res.status(400).json({ message: 'Missing question' });

        if (!q.options || !Array.isArray(q.options) || q.options.some(option => !option.option || option.option.trim() === '' || !option.value || option.value <0 && !option.movePositionTo ||option.value >=0 && option.movePositionBy==undefined  ||!option.metaInfo)) {
          return res.status(400).json({ message: 'Options array for question: ' + q.question + ' must contain non-empty option, metaInfo,value and movePositionTo(for wrong options) or movePositionBy(for correct options).' });
       }
      
       if( q.options.some(option=>option?.movePositionTo>100 || option?.movePositionTo<0)){
        return res.status(400).json({message:'Options array for question: '+q.question+'must contain movePositionTo value between 0 to 100 (both inclusive)'})
       }
       if( q.options.some(option=>option?.movePositionBy>3 || option?.movePositionTo<0)){
        return res.status(400).json({message:'Options array for question: '+q.question+'must contain movePositionBy value between 0 to 3 (both inclusive)'})
       }
       if (q.options.length<2||q.options.length>6) {
        return res.status(400).json({ message: 'Options array for question: ' + q.question + ' must contain atleast 2 and atmost 6 non-empty option and value.' });
     }
    
          const options = q.options.map(option => option.option);
          const uniqueOptions = new Set(options);
          if (uniqueOptions.size !== options.length) {
              return res.status(400).json({ message: 'All options within each question must be unique.' });
          }
      }

      // Create questions in the database
     let createData= questions.map(q=>{
      let obj={};
      obj['question']=q.question;
      obj['options']=q.options.map(option => ({ option: option.option, value: option.value, metaInfo:option.metaInfo,movePositionTo:option.movePositionTo,movePositionBy:option.movePositionBy }));
      return obj
     })
     const createdQuestions = await db.ValueBuddyQuestion.create({
       questions: JSON.stringify(createData), // Store options as a JSON string
      SuborganisationId:suborganisationId
  });

      res.status(201).json(createdQuestions);
  } catch (err) {
      res.status(400).json({ message: err.message });
  }
});

// Update ValueBuddy Question
router.patch('/updateValuebuddyQuestion', async (req, res) => {
  try {
      const { suborgId, questions } = req.body;

  if(!suborgId){
    return res.status(404).json({ message: 'Please provide  suborgid!' });
  }
  const assets = await db.Assets.findOne({where:{SuborganisationId:suborgId}});
  if (!assets) {
    return res.status(404).json({ message: 'Asset configuration not found for given suborganisation.' });
}
  

      // Check if the question exists for the given suborganization
      const existingQuestion = await db.ValueBuddyQuestion.findOne({ where: { SuborganisationId:suborgId } });
      if (!existingQuestion) {
          return res.status(404).json({ message: 'Value buddy questions not found for the given suborganization.' });
      }

      if(!questions ||!Array.isArray(questions) || questions.length==0)
        return res.status(404).json({ message: 'questions can\'t be empty!' });

      const questionsData=JSON.parse(existingQuestion.questions);

      for (const q of questions) {
        if(q.questionId==undefined){
          return res.status(400).json({ message: 'questionId is missing for question: ' + q.question});
        }
        if(q.question &&  questionsData.some(que,index=>index!=q.questionId&&que.question==q.question)){
          return res.status(400).json({ message: 'Updated question already exists for the given suborganization.' });
        }
       if(q.options){
     
       if ( !Array.isArray(q.options) || q.options.some(option => !option.option || option.option.trim() === '' || !option.value || (option.value<0 && !option.movePositionTo) ||!option.metaInfo)) {
        return res.status(400).json({ message: 'Options array for questionId: ' + q.questionId + ` must contain non-empty option, metaInfo,value and movePositionTo.(note: movePositionTo should be provided for wrong options only!).` });
     }

     if( q.options.some(option => option.value<0 && ( option.movePositionTo > assets?.gatePositions?.[q.questionId] || option.movePositionTo<0 ||  assets?.gatePositions.some(id=>id==option.movePositionTo)))){
      return res.status(400).json({message:'Options array for questionId:'+q.questionId+` must contain movePositionTo value between [0  to ${assets?.gatePositions?.[q.questionId]}(current gate position)) (note: excluding gate positions)`})
     }
       if (q.options.length<2||q.options.length>6) {
        return res.status(400).json({ message: 'Options array for questionId: ' + q.questionId + ' must contain atleast 2 and atmost 6 non-empty option and value.' });
     }

     const optionValues = q.options.map(option => option.option);
     const uniqueOptions = new Set(optionValues);
     if (uniqueOptions.size !== optionValues.length) {
         return res.status(400).json({ message: 'Options must be unique for questionId:'+q.questionId });
     }
    }
    }


    

   
    for (const q of questions) {
      questionsData[q.questionId]={
        question:q.question?? questionsData[q.questionId].question,
        options:q.options?q.options.map(option=>{return {"option":option.option,"value":option.value,metaInfo:option.metaInfo,movePositionTo:option.movePositionTo}}): questionsData[q.questionId].options
      }

    }

      // Update the question
      await existingQuestion.update({ SuborganisationId:suborgId,questions:JSON.stringify(questionsData) });

      res.json(existingQuestion);
  } catch (err) {
      res.status(400).json({ message: err.message });
  }
});


// Get all questions for a given suborganization
router.get('/valuebuddyQuestions', async (req, res) => {
  try {
      const { suborgId } = req.query;

      console.log('suborgId',suborgId)
      // Retrieve questions for the given suborganization
      const questions = await db.ValueBuddyQuestion.findAll({ where: { SuborganisationId:suborgId } });

      res.json(questions);
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});



// Delete ValueBuddy Question by Suborganization ID
router.delete('/deleteAllValuebuddydQuestions', async (req, res) => {
  try {
    const { suborgId } = req.query;
      
      // Check if there are questions associated with the given suborganization
      const questionsToDelete = await db.ValueBuddyQuestion.findAll({ where: { suborgId } });
      if (questionsToDelete.length === 0) {
          return res.status(404).json({ message: 'No questions found for the given suborganization.' });
      }

      // Delete all questions associated with the given suborganization
      await ValueBuddyQuestion.destroy({ where: { suborgId } });

      res.json({ message: 'ValueBuddy questions deleted successfully.' });
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});


module.exports = router;
