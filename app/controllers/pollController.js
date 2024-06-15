
const express = require('express');
const router = express.Router();
const db = require('../models');
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

  // await db.PollQuestion.bulkCreate(createData);

      // Create questions
      let createdQuestions = await db.PollQuestion.bulkCreate(
        questions.map(q => ({
          question: q.question,
          SuborganisationId: suborgId
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
            option: option,
            PollQuestionId: questionId,
            SuborganisationId: suborgId
          });
        });
      });
  
      // Bulk create options
      await db.PollOption.bulkCreate(createOptions);

  res.status(200).send({ message: 'Poll Questions and options addded successfully.' });
});

// Update a specific question by id and suborgId
// router.patch('/updateQuestion', checkSuborgExists, async (req, res) => {

//   const {questionId,suborgId, questionData } = req.body;
//   if(!questionId){
//     return res.status(400).send({ error: 'questionId cantbe empty!' });
//   }
  
//   if(!questionData || questionData && !questionData?.question || questionData&& !questionData?.options){
//     return res.status(400).send({ error: ' question must contain updated question or options!' });
//   }

//   const existingQuestions = await db.PollQuestion.findAll({
//     where: {
//     SuborganisationId:suborgId,
//         question: questionData?.question    
//     }
//     });

//     if (existingQuestions.length > 0) {
//     return res.status(400).send({ message:"question: "+ questionData?.question+' already exist for the given suborgId.' });
//     }
//     if(questionData?.options){
//     if (questionData?.options &&( !Array.isArray(questionData.options) || questionData.options.some(option => !option || option.trim() === '' ))) {
//       return res.status(400).json({ message: 'Options array for question: ' + questionData.question + ' must contain non-empty options!' });
//    }
  

//    if (questionData?.options &&(questionData.options.length<2||questionData.options.length>6)) {
//     return res.status(400).json({ message: 'Options array for question: ' + questionData.question + ' must contain atleast 2 and atmost 5 non-empty options!' });
//    }
  
//       const options = questionData?.options.map(option => option);
//       const uniqueOptions = new Set(options);
//       if (uniqueOptions.size !== options.length) {
//           return res.status(400).json({ message: 'All options within each question must be unique.' });
//       }
//    }

//   const result = await db.PollQuestion.update(
//     { question:questionData?.question ,options:questionData?.options },
//     { where: { id:questionId, SuborganisationId: suborgId } }
//   );

//   if (result[0] === 0) {
//     return res.status(404).send({ error: 'Question not found or suborgId mismatch.' });
//   }

//   res.status(200).send({ message: 'Poll Question updated successfully.' });
// });
// Update a specific question by id and suborgId
router.patch('/updateQuestion', checkSuborgExists, async (req, res) => {
  const {  suborgId, questionData } = req.body;

  try {
    // Validate inputs
    if (!questionData || !questionData.question && !questionData.options ) {
      return res.status(400).send({ error: 'questionData must contain questionId and updated question or updated options!' });
    }


    if (!questionData?.questionId) {
      return res.status(400).send({ error: 'questionId cannot be empty!' });
    }

   
    // Check if updated question already exists for the given suborgId
    const existingQuestion = await db.PollQuestion.findOne({
      where: {
        id: questionData?.questionId,
        SuborganisationId: suborgId
      }
    });

    if (!existingQuestion) {
      return res.status(404).send({ error: 'Question not found or suborgId mismatch.' });
    }

    if ( questionData?.question && existingQuestion.question !== questionData.question) {
      const duplicateQuestion = await db.PollQuestion.findOne({
        where: {
          SuborganisationId: suborgId,
          question: questionData.question
        }
      });

      if (duplicateQuestion) {
        return res.status(400).send({ message: `Question "${questionData.question}" already exists for the given suborgId.` });
      }
    }

    if(questionData.options){
    // Validate options array
    if (!Array.isArray(questionData.options) || questionData.options.length < 2 || questionData.options.length > 6) {
      return res.status(400).send({ message: 'Options array must contain between 2 and 6 non-empty options.' });
    }

    const uniqueOptions = new Set(questionData.options);
    if (uniqueOptions.size !== questionData.options.length) {
      return res.status(400).send({ message: 'All options within the question must be unique.' });
    }
  }

    // Update the question and its options
    await db.sequelize.transaction(async (t) => {
      if( questionData.question){
      // Update question
      await db.PollQuestion.update(
        { question: questionData.question },
        { where: { id:  questionData.questionId, SuborganisationId: suborgId }, transaction: t }
      );
    }
    if(questionData.options){

      // Delete existing options
      await db.PollOption.destroy({
        where: { PollQuestionId: questionId, SuborganisationId: suborgId },
        transaction: t
      });

      // Create new options
      const createOptions = questionData.options.map(option => ({
        option,
        PollQuestionId: questionId,
        SuborganisationId: suborgId
      }));

      await db.PollOption.bulkCreate(createOptions, { transaction: t });
    }
    });

    res.status(200).send({ message: 'Poll Question updated successfully.' });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).send({ error: 'Failed to update question.' });
  }
});


// Delete a specific question by id and suborgId
router.delete('/deleteQuestion', checkSuborgExists, async (req, res) => {
  const { questionId, suborgId } = req.body;

  const result = await PollQuestion.destroy({
    where: { id: questionId, SuborganisationId: suborgId },
    include: [PollOption] // Include related options to delete them
  });

  if (result === 0) {
    return res.status(404).send({ error: 'Question not found or suborgId mismatch.' });
  }

  res.status(200).send({ message: 'Poll Question and options deleted successfully.' });
});

// Store feedback response
router.post('/saveResponse',authenticateJWT, async (req, res) => {
  const { suborgId, gameId, response } = req.body;
  const userId=req.user.id
  if (!Array.isArray(response) || response.some(r => !r.questionId ||  !r?.optionId )) {
    return res.status(400).send({ error: 'Response must be an array of objects with questionId and optionId.' });
  }

  // Prepare feedback responses
  const pollResponses = response.map(r => ({
    SuborganisationId:suborgId,
    UserId:userId,
    GameId:gameId,
    PollQuestionId: r.questionId,
    PollOptionId: r.optionId

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
  
    const questions = await db.PollQuestion.findAll({
      where: { SuborganisationId: suborgId },
      attributes: ['id', 'question'],
      include: [{
        model: db.PollOption,
        attributes: ['id', 'option']
      }]
    });
    
    // Format the result
    const pollQuestions = questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.PollOptions.map(o => ({
        id: o.id,
        option: o.option
      }))
    }));
  
    res.status(200).send(pollQuestions);
  });
  
  // Get all poll responses for a suborgId
  router.get('/getResponses', checkSuborgExists, async (req, res) => {
    const { suborgId } = req.body;
  
    const pollResponses = await db.PollResponse.findAll({
      where: {SuborganisationId: suborgId }
    });
  
    const formattedResponses = pollResponses.map(poll => ({
      response: poll?.optionId,
      GameId:poll?.GameId
    }));
  
    res.status(200).send(formattedResponses);
  });
  




module.exports = router;