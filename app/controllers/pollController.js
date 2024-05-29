
const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = require('sequelize');
const { checkSuborgExists, authenticateJWT } = require('../midllewares/authMiddleware');


// Create or update feedback questions for a given suborgId
router.post('/createQuestions', checkSuborgExists, async (req, res) => {

  const {suborgId,questions } = req.body;


  if (!Array.isArray(questions) || questions.length > 6) {
    return res.status(400).send({ error: 'Expecting an array of questions with a maximum length of 6.' });
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


          // Check for duplicate questions for the same suborgId
        const existingQuestions = await db.PollQuestion.findAll({
        where: {
        SuborganisationId:suborgId,
            question: q.question    
        }
        });

        if (existingQuestions.length > 0) {
        return res.status(400).send({ message:"question: "+ q.question+' already exist for the given suborgId.' });
        }
        if (!q.options || !Array.isArray(q.options) || q.options.some(option => !option || option.trim() === '' )) {
          return res.status(400).json({ message: 'Options array for question: ' + q.question + ' must contain non-empty options!' });
       }
      

       if (q.options.length<2||q.options.length>6) {
        return res.status(400).json({ message: 'Options array for question: ' + q.question + ' must contain atleast 2 and atmost 5 non-empty options!' });
       }
          const options = q.options.map(option => option);
          const uniqueOptions = new Set(options);
          if (uniqueOptions.size !== options.length) {
              return res.status(400).json({ message: 'All options within each question must be unique.' });
          }
      }

      let createData= questions.map(q=>{
        let obj={};
        obj['question']=q.question;
        obj['options']=q.options;
        obj['SuborganisationId']=suborgId;
        return obj
       })


  await db.PollQuestion.bulkCreate(createData);

  res.status(200).send({ message: 'Poll Questions addded successfully.' });
});

// Update a specific question by id and suborgId
router.patch('/updateQuestion', checkSuborgExists, async (req, res) => {

  const {questionId,suborgId, questionData } = req.body;
  if(!questionId){
    return res.status(400).send({ error: 'questionId cantbe empty!' });
  }
  
  if(!questionData || questionData && !questionData?.question || questionData&& !questionData?.options){
    return res.status(400).send({ error: ' question must contain updated question or options!' });
  }

  const existingQuestions = await db.PollQuestion.findAll({
    where: {
    SuborganisationId:suborgId,
        question: questionData?.question    
    }
    });

    if (existingQuestions.length > 0) {
    return res.status(400).send({ message:"question: "+ questionData?.question+' already exist for the given suborgId.' });
    }
    if(questionData?.options){
    if (questionData?.options &&( !Array.isArray(questionData.options) || questionData.options.some(option => !option || option.trim() === '' ))) {
      return res.status(400).json({ message: 'Options array for question: ' + questionData.question + ' must contain non-empty options!' });
   }
  

   if (questionData?.options &&(questionData.options.length<2||questionData.options.length>6)) {
    return res.status(400).json({ message: 'Options array for question: ' + questionData.question + ' must contain atleast 2 and atmost 5 non-empty options!' });
   }
  
      const options = questionData?.options.map(option => option);
      const uniqueOptions = new Set(options);
      if (uniqueOptions.size !== options.length) {
          return res.status(400).json({ message: 'All options within each question must be unique.' });
      }
   }

  const result = await db.PollQuestion.update(
    { question:questionData?.question ,options:questionData?.options },
    { where: { id:questionId, SuborganisationId: suborgId } }
  );

  if (result[0] === 0) {
    return res.status(404).send({ error: 'Question not found or suborgId mismatch.' });
  }

  res.status(200).send({ message: 'Poll Question updated successfully.' });
});

// Delete a specific question by id and suborgId
router.delete('/deleteQuestion', checkSuborgExists, async (req, res) => {
  const { questionId, suborgId } = req.body;

  const result = await db.PollQuestion.destroy({ where: { id:questionId, SuborganisationId:suborgId } });

  if (result === 0) {
    return res.status(404).send({ error: 'Question not found or suborgId mismatch.' });
  }

  res.status(200).send({ message: 'Poll Question deleted successfully.' });
});

// Store feedback response
router.post('/saveResponse',authenticateJWT, async (req, res) => {
  const { suborgId, gameId, response } = req.body;
  const userId=req.user.id
  if (!Array.isArray(response) || response.some(r => !r.questionId ||  !r?.question|| !r?.option )) {
    return res.status(400).send({ error: 'Response must be an array of objects with questionId , question and option.' });
  }

  // Prepare feedback responses
  const pollResponses = response.map(r => ({
    SuborganisationId:suborgId,
    UserId:userId,
    GameId:gameId,
    PollQuestionId: r.questionId,
    response: JSON.stringify({question:r.question,option:r.option}),

  }));

 

  // Insert feedback responses
  const createdResponses = await db.PollResponse.bulkCreate(pollResponses);

  if(createdResponses){
    const gameState= await db.GameState.findOne({
      where:{UserId:userId,GameId:gameId}
     })
     await gameState.update({step:6})
    }
  res.status(200).send({ message: 'Poll response saved successfully!.',type:'success' });
});



// Get poll questions and options by suborgId
router.get('/questions', authenticateJWT, async (req, res) => {
    const { suborgId } = req.query;
  
    const pollQuestions = await db.PollQuestion.findAll({
      where: { SuborganisationId:suborgId },
      attributes: ['id', 'question', 'options']
    });
  
    res.status(200).send(pollQuestions);
  });
  
  // Get all poll responses for a suborgId
  router.get('/getResponses', checkSuborgExists, async (req, res) => {
    const { suborgId } = req.body;
  
    const pollResponses = await db.PollResponse.findAll({
      where: {SuborganisationId: suborgId }
    });
  
    const formattedResponses = pollResponses.map(poll => ({
      response: JSON.parse(poll?.response),
      GameId:poll?.GameId
    }));
  
    res.status(200).send(formattedResponses);
  });
  




module.exports = router;