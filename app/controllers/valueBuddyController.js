


const express = require('express');
const router = express.Router();
const db = require('../models');

// Create ValueBuddy Questions
router.post('/createQuestions', async (req, res) => {
    try {
        const questions = req.body.questions;
        const suborganisationId=req.body.suborgId;
        console.log('req body',req.body)

        if(!suborganisationId)
          return res.status(400).json({ message: 'suborgId is missing.' });
        const gameConfiguration = await db.GameConfiguration.findOne({where:{SuborganisationId:suborganisationId}});
        if (!gameConfiguration) {
          return res.status(404).json({ message: 'Game configuration not found for given suborganisation.' });
      }
        
        // Check if questions array has exactly 16 elements
        if (!Array.isArray(questions) || questions.length !== 16) {
            return res.status(400).json({ message: 'Expected 16 questions.' });
        }
  
        // Check if all questions are unique
        const uniqueQuestions = new Set(questions.map(q => q?.question));
        if (uniqueQuestions.size !== questions.length) {
            return res.status(400).json({ message: 'All questions must be unique.' });
        }

        // Check if all gate numbers are unique
           const uniqueGates = new Set(questions.map(q => q?.gateNumber));
           if ( uniqueGates.size !== questions.length) {
               return res.status(400).json({ message: 'All gate numbers must be unique.' });
           }
  
        // Check if all options within each question are unique
        let index=0;
        for (const q of questions) {
            
          if(!q.question)
            return res.status(400).json({ message: 'Missing question!' });
         if(!q.gateNumber){
            return res.status(400).json({ message: 'Missing gateNumber!' });
         }
  
          if (!q.options || !Array.isArray(q.options) || q.options.some(option => !option.option 
            || option.option.trim() === '' || !option.value 
            || option.movePosition==undefined 
             ||!option.metaInfo)) {
            return res.status(400).json({ message: 'Options array for question: ' + q.question + ' must contain non-empty option, metaInfo,value and movePosition.' });
         }
        
     
         if( q.options.some(option => option.value<0 && ( option?.movePosition > gameConfiguration?.gatePositions?.[index] || option.movePosition<1 ||  gameConfiguration?.gatePositions.some(id=>id==option.movePosition)))){
            return res.status(400).json({message:'Options array for questionId:'+q.questionId+` must contain movePosition value between [1  to ${gameConfiguration?.gatePositions?.[index]}(current gate position)) (note: excluding gate positions)`})
           }


         if( q.options.some(option=>option.value >=0 && (option?.movePosition>3 || option?.movePosition<0))){
          return res.status(400).json({message:'Options array for question: '+q.question+'must contain movePosition value between 0 to 3 (both inclusive) for correct choice.'})
         }
         if (q.options.length<2||q.options.length>6) {
          return res.status(400).json({ message: 'Options array for question: ' + q.question + ' must contain atleast 2 and atmost 6 non-empty option and value.' });
       }
      
            const options = q.options.map(option => option.option);
            const uniqueOptions = new Set(options);
            if (uniqueOptions.size !== options.length) {
                return res.status(400).json({ message: 'All options within each question must be unique.' });
            }
            index+=1;
        }

           // Create questions
      let createdQuestions = await db.ValueBuddyQuestion.bulkCreate(
        questions.map(q => ({
          question: q.question,
          SuborganisationId: suborganisationId,
          gateNumber:q.gateNumber
        })),
        { returning: true } // This ensures that the created questions are returned with their IDs
      );
  
      // Extract question IDs
      const questionIds = createdQuestions?.map(q => q.id);
  
      // Create options using the question IDs
      let createOptions = [];
      questionIds.forEach((questionId, index) => {
        questions[index].options.forEach(option => {
          createOptions.push({
            option: option.option,
            value: option.value,
            metaInfo:option.metaInfo,
            movePosition:option.movePosition,
            ValueBuddyQuestionId: questionId,
            SuborganisationId: suborganisationId
          });
        });
      });
  
      // Bulk create options
      await db.ValueBuddyOption.bulkCreate(createOptions);

  res.status(200).send({ message: 'Valu buddy Questions and options addded successfully.' });


    } catch (err) {
        res.status(400).json({ message: err.message });
    }
  });
  
  // Update ValueBuddy Question
  router.patch('/updateQuestions', async (req, res) => {
    try {
        const { suborgId, questions } = req.body;
  
    if(!suborgId){
      return res.status(404).json({ message: 'Please provide  suborgid!' });
    }
    const gameConfiguration = await db.GameConfiguration.findOne({where:{SuborganisationId:suborgId}});
    if (!gameConfiguration) {
      return res.status(404).json({ message: 'Game configuration not found for given suborganisation.' });
  }
    
  
        // Check if the question exists for the given suborganization
        const existingQuestion = await db.ValueBuddyQuestion.findOne({ where: { SuborganisationId:suborgId } });
        if (!existingQuestion) {
            return res.status(404).json({ message: 'Value buddy questions not found for the given suborganization.' });
        }
  
        if(!questions ||!Array.isArray(questions) || questions.length==0)
          return res.status(404).json({ message: 'questions can\'t be empty!' });
 
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
  
       if( q.options.some(option => option.value<0 && ( option.movePositionTo > gameConfiguration?.gatePositions?.[q.questionId] || option.movePositionTo<0 ||  gameConfiguration?.gatePositions.some(id=>id==option.movePositionTo)))){
        return res.status(400).json({message:'Options array for questionId:'+q.questionId+` must contain movePositionTo value between [0  to ${gameConfiguration?.gatePositions?.[q.questionId]}(current gate position)) (note: excluding gate positions)`})
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
  
      // Retrieve questions for the given suborganization along with options
      const questions = await db.ValueBuddyQuestion.findAll({
        where: { SuborganisationId: suborgId },
        include: [{ model: db.ValueBuddyOption }] // Include ValueBuddyOption model to fetch associated options
      });
  
      // Map the questions and include options in the response
      const formattedQuestions = questions.map(question => ({
        id: question.id,
        question: question.question,
        options: question.ValueBuddyOptions.map(option => ({
          id: option.id,
          option: option.option
        }))
      }));
  
      res.json(formattedQuestions);
    } catch (err) {
      console.error('Error fetching ValueBuddy questions:', err);
      res.status(500).json({ message: 'Failed to fetch ValueBuddy questions.' });
    }
  });
  
  
  
  // Delete ValueBuddy Question by Suborganization ID
  router.delete('/deleteQuestions', async (req, res) => {
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