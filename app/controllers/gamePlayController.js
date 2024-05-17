
const express = require('express');
const router = express.Router();
const db = require('../models');
const { options } = require('./organisationController');

module.exports = function(io) {

  router.get('/get-data', async (req, res) => {

  
     try {
       // fetch pending game data
       const user=req.user;
     
      if(!user.pendingGame) return resetPendingGame(user,res);
       const game = await db.Game.findByPk(user.pendingGame);
       if(!game) return resetPendingGame(user,res);

       const gameState= await db.GameState.findOne({
        where:{UserId:user.id,GameId:game.id}
       })

       if(!gameState)
        return resetPendingGame(user,res);
      
       res.json({type:'success', gameState });
     } catch (error) {
       console.error('Error fetching pending game:', error);
       res.status(500).json({ type:'error', message: error.message });
     }
   });

    function resetPendingGame(user,res){
    if(user.firstTimeUser)
      return res.status(201).json({ step:-2 });
      else
      return res.status(201).json({ step:-1 });
   
   }



  router.post('/start', async (req, res) => {

   const userId=req.user.id;
    try {
      // Create a new game
      const newGame = await db.Game.create({
        startTime: new Date(),
        UserId:userId
      });
  
      // Update user's pendingGame column with the new game's ID
      await db.User.update({ pendingGame: newGame.id,firstTimeUser:false }, { where: { id: userId } });
  
      res.status(201).json({type: "success", gameId: newGame.id });
    } catch (error) {
      console.error('Error starting a new game:', error);
      res.status(500).json({ type:'error', message: error.message });
    }
  });

  router.post('/set-gametype', async (req, res) => {
    const { gameType='single',gameId } = req.body; // Assuming userId and gameType are provided in the request body
    const userId=req.user.id;
    try {
        // Find the game by its primary key (gameId)
    const game = await db.Game.findByPk(gameId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Update the game's type
    await game.update({ type: gameType });

    await db.GameState.create({
        GameId: gameId,
        UserId:userId,
        type: gameType,
        step:2
      });


  
      res.status(201).json({type: "success" });
    } catch (error) {
      console.error('Error starting a new game:', error);
      res.status(500).json({ type:'error', message: error.message });
    }
  });

  router.post('/select-token', async (req, res) => {
    const { gameId, selectedToken } = req.body;
    const userId=req.user.id;
    try {

        const gameState = await db.GameState.findOne({
            where: { GameId: gameId, UserId: userId }
          });
      
          if (!gameState) {
            return res.status(404).json({ error: 'Game state not found' });
          }
      
          // Update the isValueBuddySelected field to true
          await gameState.update({  step:3,  selectedToken: selectedToken, });
 
  
      res.json({ success: true });
    } catch (error) {
      console.error('Error selecting token:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

  router.post('/valuebuddy-check', async (req, res) => {
    const { gameId } = req.body;
    const userId=req.user.id;
    try {
      // Find the relevant game state entry by gameId and userId
      const gameState = await db.GameState.findOne({
        where: { GameId: gameId, UserId: userId }
      });
  
      if (!gameState) {
        return res.status(404).json({ error: 'Game state not found' });
      }
  
      // Update the isValueBuddySelected field to true
      await gameState.update({ isValueBuddySelected: true, step:3 });
  
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating game state:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } 
  });

  async function handleRollDice(gameId,userId,diceValue,suborgId,isGateReached,movePositionTo){


    const gatePositions=[6,13,18,26,32,39,45,52,58,64,70,75,83,87,91,99];
    const karmaPositions=[18,39,58,75,91];
    
    //    // Find the current game state for the user
       let gameState = await db.GameState.findOne({ where: { gameId, userId } });
       console.log(gameState)

    let diceResult =0;
    if(diceValue!='$'){
      diceResult=diceValue??0;
    }
    if(isGateReached){
      diceResult=0;
    }
 
     
       // Calculate updated values for lastReachedPosition and totalScore
       let lastReachedPosition = diceResult+ gameState?.lastReachedPosition??0 ;

       if(movePositionTo!=-1){
        lastReachedPosition=movePositionTo;
       }
    
       let totalScore =  (isGateReached?diceValue:0)+gameState.totalScore;
       console.log("total score:",totalScore)

       if(lastReachedPosition<0){
        lastReachedPosition=0;
       }
      //  if(totalScore<0){
      //   totalScore=0;
      //  }

       const lastCrossedGatePositon=gameState?.lastCrossedGatePositon??0;
       console.log("last crossed gate position",lastCrossedGatePositon,lastReachedPosition,diceValue,movePositionTo);
       const  noOfKarmas=gameState?.noOfKarmas;
       let isValueBuddyQuestion=gameState.isValueBuddyQuestion;
    // check if lastreached position crossed gate
    let crossedGatePosition = 0;
    let isGateCrossed=false;
    let question=null;
    let reachedKarmas=0;
    let index=0;
    // Iterate over gatePositions array
    for (let i = 0; i < gatePositions.length; i++) {
      if (lastReachedPosition >= gatePositions[i] ) {
        crossedGatePosition = gatePositions[i];
         index=i;

      }else{
        break;
      }

    } 


    for (let i = 0; i < karmaPositions.length; i++) {
      if (lastReachedPosition >= karmaPositions[i] ) {
        reachedKarmas = i+1;
      }else{
        break;
      }

    } 



if(diceResult>=0 && movePositionTo==-1){
    if( crossedGatePosition!=lastCrossedGatePositon){
      //get index of crossedGatePosition
      // with that index get the question
      isValueBuddyQuestion=true;
      isGateCrossed=true;
    }else{
      isValueBuddyQuestion=false;
      crossedGatePosition=lastReachedPosition;
    }

   

        // Update GameState table with the dice result and other values
        gameState=  await gameState.update({ 
          lastDiceCount: diceValue!='$'?diceResult:gameState.lastDiceCount,
          lastReachedPosition:  lastReachedPosition,
          totalScore: totalScore,
          noOfKarmas:reachedKarmas,
          lastCrossedGatePositon:isGateCrossed?crossedGatePosition:lastCrossedGatePositon,
          isValueBuddyQuestion:diceValue!='$'?isValueBuddyQuestion:undefined
         })
  }
  else{

    if(  lastReachedPosition==crossedGatePosition && lastReachedPosition!=0){
      //get index of crossedGatePosition
      // with that index get the question
      isValueBuddyQuestion=true
 
    }else{
      isValueBuddyQuestion=false;
    }

        // Update GameState table with the dice result and other values
      gameState=  await gameState.update({ 
          lastReachedPosition: lastReachedPosition,
          totalScore: totalScore,
          noOfKarmas:reachedKarmas,
          lastCrossedGatePositon:crossedGatePosition,
          isValueBuddyQuestion:diceValue!='$'?isValueBuddyQuestion:undefined,
         })
  }
     


  if(gameState.isValueBuddyQuestion ){

    try {
      // Perform the query
      const valueBuddyQuestion = await db.ValueBuddyQuestion.findOne({
        where: { SuborganisationId: suborgId },
      });
      if(valueBuddyQuestion.questions){
      let questions=JSON.parse(valueBuddyQuestion.questions);
      question={
      id:index,
      question:questions[index]?.question,
      options:questions[index]?.options?.map(ele=>ele.option)
    }
    }

    } catch (error) {
      throw new Error('Failed to retrieve ValueBuddy question: ' + error.message);
    }
  }
  if(lastReachedPosition>=100){
    const user = await db.User.findByPk(userId);
    const game = await db.Game.findByPk(gameId);
    await user.update({
      pendingGame:null
    })
    await game.update({
      endTime:new Date()
    })
  }

  let karmaFlag=null;
  if(noOfKarmas<reachedKarmas){
    karmaFlag=1
  }else if(noOfKarmas>reachedKarmas){
    karmaFlag=0
  }

   
       return {diceResult:gameState?.lastDiceCount,lastReachedPosition:gameState.lastReachedPosition,question, noOfKarmas:gameState.noOfKarmas,totalScore,karmaFlag}
  }

  io.on('connection', socket => {
   // console.log('A user connected',socket.user.id);
    
    socket.on('join-game', ({ gameId }) => {
      // Join the socket to a room corresponding to the game ID
      console.log('joined room with id',gameId)
      socket.join(gameId);
    });
  
    socket.on('fetch-game-state', async({ gameId }) => {
      // fetch game state for  the game ID
      try {
      const userId = socket.user.id;
      const suborgId=socket.user.SuborganisationId;
      const gameState= await db.GameState.findOne({
        where:{UserId:userId,GameId:gameId}
       })
      console.log('joined room with id',gameId);
      if(gameState?.isValueBuddySelected){
      const {diceResult,lastReachedPosition,question,noOfKarmas,totalScore,karmaFlag}=await handleRollDice(gameId,userId,'$', suborgId, false,-1)
  
      // Emit the dice-rolled event to the specific game room identified by gameId
      io.to(gameId).emit('dice-rolled', { gameId, diceResult,lastReachedPosition,question,noOfKarmas ,totalScore,karmaFlag,refreshed:true});
      }
    } catch (error) {
      console.error('Error rolling dice:', error);
    }
    });
  
  
    socket.on('roll-dice', async ({ gameId}) => {
    console.log('dice rolled',gameId,socket.user.id)
      try {
        const userId = socket.user.id;
        const suborgId=socket.user.SuborganisationId;
        // Handle rolling dice
         const diceValue= Math.floor(Math.random() * 6) + 1;
      
        const {diceResult,lastReachedPosition,question,noOfKarmas,totalScore,karmaFlag}=await handleRollDice(gameId,userId,diceValue, suborgId,false,-1)
  
        // Emit the dice-rolled event to the specific game room identified by gameId
        io.to(gameId).emit('dice-rolled', { gameId, diceResult,lastReachedPosition,question,noOfKarmas,totalScore,karmaFlag });
      } catch (error) {
        console.error('Error rolling dice:', error);
      }
    });
  

    socket.on('handle-valuebuddy-question',async ({gameId,questionId,selectedOption})=>{
 //check the option value add it lastreachdPosition and update lastCrossedGatePositon
 try {

  const userId = socket.user.id;
  const suborgId=socket.user.SuborganisationId;

  const valueBuddyQuestion = await db.ValueBuddyQuestion.findOne({
    where: { SuborganisationId: suborgId },
  });

  let questions=JSON.parse(valueBuddyQuestion.questions);
  const options=questions[questionId]?.options;
  const value=options[selectedOption]?.value;
  const isCorrect=value<0?false:true;
  const movePositionTo=isCorrect?-1:options[selectedOption]?.movePositionTo;
 
  const metaInfo=options[selectedOption]?.metaInfo;
 
      const {diceResult,lastReachedPosition,question,noOfKarmas,totalScore,karmaFlag}=await handleRollDice(gameId,userId,value, suborgId,true,movePositionTo);
      io.to(gameId).emit('dice-rolled', { gameId,lastReachedPosition,noOfKarmas,question, 
        choosenOptionResult:!question?{optionId:selectedOption,isCorrect,metaInfo}:null ,
        totalScore,karmaFlag});
    } catch (error) {
      console.error('Error handling valuebuddy question:', error);
    }
    })
  
    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  });
  

  return router;
};
