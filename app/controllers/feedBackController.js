
const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { checkSuborgExists, authenticateJWT } = require('../midllewares/authMiddleware');


const downloadsDir = path.join(__dirname, '..', 'downloads');


// Create or update feedback questions for a given suborgId
router.post('/createQuestions', checkSuborgExists, async (req, res) => {

  const {suborgId,questions } = req.body;


  if (!Array.isArray(questions) || questions.length > 6) {
    return res.status(400).send({ error: 'Expecting an array of questions with a maximum length of 6.' });
  }
    // Check if all questions are unique
 const uniqueQuestions = new Set(questions.map(q => q));
    if (uniqueQuestions.size !== questions.length) {
        return res.status(400).json({ message: 'All questions must be unique.' });
    }
       // Check if all options within each question are unique
       for (const q of questions) {
        if(!q)
          return res.status(400).json({ message: 'Missing question' });


          // Check for duplicate questions for the same suborgId
        const existingQuestions = await db.FeedbackQuestion.findAll({
        where: {
        SuborganisationId:suborgId,
            question: q   
        }
        });

        if (existingQuestions.length > 0) {
        return res.status(400).send({ message:"question: "+ q.question+' already exist for the given suborgId.' });
        }
     
      }
    


  // Insert new questions
  const newQuestions = questions.map(question => ({ SuborganisationId:suborgId, question }));
  await db.FeedbackQuestion.bulkCreate(newQuestions);

  res.status(200).send({ message: 'Questions addded successfully.' });
});

// Update a specific question by id and suborgId
router.patch('/updateQuestion', checkSuborgExists, async (req, res) => {

  const {questionId,suborgId, question } = req.body;
  if(!questionId){
    return res.status(400).send({ error: 'questionId cantbe empty!' });
  }
  
  if(!question){
    return res.status(400).send({ error: ' question cantbe empty!' });
  }
  // Check if the question already exists for the same suborgId
  const existingQuestion = await db.FeedbackQuestion.findOne({
    where: {
        SuborganisationId:suborgId,
      question,
      id: { [Op.ne]: questionId}
    }
  });

  if (existingQuestion) {
    return res.status(400).send({ error: 'The question already exists for the given suborgId.' });
  }

  const result = await db.FeedbackQuestion.update(
    { question },
    { where: { id:questionId, SuborganisationId: suborgId } }
  );

  if (result[0] === 0) {
    return res.status(404).send({ error: 'Question not found or suborgId mismatch.' });
  }

  res.status(200).send({ message: 'Question updated successfully.' });
});

// Delete a specific question by id and suborgId
router.delete('/deleteQuestion', checkSuborgExists, async (req, res) => {
  const { questionId, suborgId } = req.body;

  const result = await db.FeedbackQuestion.destroy({ where: { id:questionId, SuborganisationId:suborgId } });

  if (result === 0) {
    return res.status(404).send({ error: 'Question not found or suborgId mismatch.' });
  }

  res.status(200).send({ message: 'Question deleted successfully.' });
});

// Store feedback response
router.post('/saveResponse',authenticateJWT, async (req, res) => {
  const { suborgId, gameId, response } = req.body;
  const userId=req.user.id

  if (!Array.isArray(response) || response.some(r => !r.questionId || !r.feedback || typeof r.feedback !== 'object')) {
    return res.status(400).send({ error: 'Response must be an array of objects with questionId and feedback( value buddy and feedback).' });
  }
  
  const {count}=await db.Game.findAndCountAll({where:{UserId:userId}});
  // Prepare feedback responses
  const feedbackResponses = []
  response.forEach(r => {
   let obj= r.feedback.map(feedback=>( {
    SuborganisationId:suborgId,
    UserId:userId,
    GameId:gameId,
    FeedbackQuestionId: r.questionId,
    valueBuddy:feedback.valueBuddy,
    response:feedback.response,
    attempt:`attempt-${count}`

  }))
feedbackResponses.push(...obj);
});

 
  // Insert feedback responses
  const createdResponses = await db.FeedbackResponse.bulkCreate(feedbackResponses);
if(createdResponses){
  const gameState= await db.GameState.findOne({
    where:{UserId:userId,GameId:gameId}
   })
   await gameState.update({step:5})
  }


  // Create the Excel file
  const questionMap = new Map();
  for (const r of response) {
    const questionText = (await db.FeedbackQuestion.findByPk(r.questionId))?.question;
    if (!questionMap.has(r.questionId)) {
      questionMap.set(r.questionId, {
        question: questionText,
        feedbacks: []
      });
    }
    r.feedback.forEach(feedback => {
      questionMap.get(r.questionId).feedbacks.push(feedback);
    });
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('FeedbackResponses');

  // Add headers
  const headers = ['Question'];
  const maxFeedbacks = Math.max(...Array.from(questionMap.values()).map(q => q.feedbacks.length));
  for (let i = 1; i <= maxFeedbacks; i++) {
    headers.push(`ValueBuddy${i}`);
    headers.push(`Response${i}`);
  }
  worksheet.addRow(headers);

  // Add data rows
  questionMap.forEach((value) => {
    const row = [value.question];
    value.feedbacks.forEach(feedback => {
      row.push(feedback.valueBuddy, feedback.response);
    });
    worksheet.addRow(row);
  });


  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
  }

  // Generate the Excel file
  const filePath = path.join(downloadsDir, `feedback_responses_${userId}_${Date.now()}.xlsx`);
  await workbook.xlsx.writeFile(filePath);

  // // Send the Excel file to the frontend
  // res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
  // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  
  // const fileStream = fs.createReadStream(filePath);
  // fileStream.pipe(res);

  // // Delete the file after sending
  // fileStream.on('end', () => {
  //   fs.unlinkSync(filePath);
  // });

    // Send response with download link
    res.status(200).send({
      message: 'Feedback saved successfully!',
      type: 'success',
      downloadLink: `api/feedback/download/${path.basename(filePath)}`
    });
  


});

// Endpoint to handle file download
router.get('/download/:filename', authenticateJWT, (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(downloadsDir, filename);

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);

  // Delete the file after sending
  fileStream.on('end', () => {
    fs.unlinkSync(filePath);
  });

  fileStream.on('error', () => {
    res.status(500).send({ error: 'File download failed.' });
  });
});

// Get feedback questions by suborgId
router.get('/questions',authenticateJWT, async (req, res) => {
    const { suborgId } = req.query;
  
    const feedbackQuestions = await db.FeedbackQuestion.findAll({
      where: { SuborganisationId:suborgId },
      attributes: ['id', 'question']
    });
  
    res.status(200).send(feedbackQuestions);
  });

    // Get all feedback responses for a suborgId
 router.post('/getResponses', checkSuborgExists, async (req, res) => {
        const { suborgId } = req.body;
      
        const feedbackResponses = await db.FeedbackResponse.findAll({
          where: {SuborganisationId: suborgId }
        });
      
        const formattedResponses = feedbackResponses.map(feedback => ({
          feedback:feedback?.response,
          userId:feedback?.UserId,
          valueBuddy:feedback?.valueBuddy,
          GameId:feedback?.GameId
        }));
      
        res.status(200).send(formattedResponses);
      })
      
    
    
    
  

module.exports = router;