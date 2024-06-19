
const express = require('express');
const router = express.Router();
const db = require('../models');


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
   const suborgId=req.user.SuborganisationId
    try {
      // Create a new game
      const newGame = await db.Game.create({
        startTime: new Date(),
        UserId:userId,
        SuborganisationId:suborgId
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
  
  router.post('/end-game',async(req,res)=>{

    const userId=req.user.id;
     try {
       // end the game
       const {gameId}=req.body
       const game = await db.Game.findByPk(gameId);
       const user = await db.User.findByPk(userId);
       await user.update({
         pendingGame:null
       })
      await game.update({endTime:new Date()})
       res.status(201).json({type: "success", });
     } catch (error) {
       console.error('Error starting a new game:', error);
       res.status(500).json({ type:'error', message: error.message });
     }
   }); 


  router.post('/valuebuddy-check', async (req, res) => {
    const { gameId, isChoosenCorrect } = req.body;
    const userId=req.user.id;
    try {
      // Find the relevant game state entry by gameId and userId
      const gameState = await db.GameState.findOne({
        where: { GameId: gameId, UserId: userId }
      });
  
      if (!gameState) {
        return res.status(404).json({ error: 'Game state not found' });
      }

      let count = await db.SelectValueBuddy.count({
        where: { GameId: gameId, UserId: userId }
      });
        count+=1;
   const createData={
    attempt:`attempt-${count}`,
    isChoosenCorrect: isChoosenCorrect,
    GameId: gameId,
     UserId: userId,
     SuborganisationId:req.user.SuborganisationId

  }
     const selectValueBuddy= await db.SelectValueBuddy.create(createData);

    if(isChoosenCorrect){
      // Update the isValueBuddySelected field to true
      await gameState.update({ isValueBuddySelected: true, step:3 });
      res.json({ success: true });
    }else{
    res.json({success: false});
    }
     
    } catch (error) {
      console.error('Error updating game state:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } 
  });

  async function handleRollDice(gameId,userId,diceValue,suborgId,isGateReached,movePositionTo,isCorrect){

    const gameConfiguration = await db.GameConfiguration.findOne({where:{SuborganisationId:suborgId}});

    const gatePositions=gameConfiguration?.gatePositions??[]
    const karmaPositions=gameConfiguration?.karmaPositions??[]
    
    //    // Find the current game state for the user
       let gameState = await db.GameState.findOne({ where: { gameId, userId } });
       console.log(gameState);

       let noOfCorrectChoosen=isGateReached&& isCorrect?gameState?.noOfCorrectChoosen+1:gameState?.noOfCorrectChoosen
       let noOfWrongChoosen=isGateReached&& !isCorrect?gameState?.noOfWrongChoosen+1:gameState?.noOfWrongChoosen

    let diceResult =0;
    if(diceValue!='$'){
      diceResult=diceValue??0;
    }
    if(isGateReached){
      diceResult=0;
    }

      let from=gameState?.lastReachedPosition??-1
       // Calculate updated values for lastReachedPosition and totalScore
       let lastReachedPosition = diceResult+ gameState?.lastReachedPosition??0 ;


     
       if(movePositionTo!=-1 && !isCorrect){
        lastReachedPosition=movePositionTo;
       }else if(movePositionTo && isCorrect){
        lastReachedPosition+=movePositionTo;
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
    let addedKarmas=[]
    let removedKarmas=[]
    let index=0;
    // Iterate over gatePositions array
    for (let i = 0; i < gatePositions.length; i++) {
      if (lastReachedPosition >= gatePositions[i] ) {
        crossedGatePosition = gatePositions[i];
         index=i+1;

      }else{
        break;
      }

    } 


    for (let i = 0; i < karmaPositions.length; i++) {
      if (lastReachedPosition >= karmaPositions[i] ) {
        reachedKarmas = i+1;
        if(i+1>noOfKarmas){
          addedKarmas.push(i);
        }
      }else if(noOfKarmas>i+1 ||(noOfKarmas>=i+1 && diceValue<0)){
      
        
        removedKarmas.push(i);
        
      }else{
        break;
      }

    } 



if(isCorrect || movePositionTo==-1){
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
          isValueBuddyQuestion:diceValue!='$'?isValueBuddyQuestion:undefined,
          noOfCorrectChoosen,
          noOfWrongChoosen,
          decisionImpact:lastReachedPosition,
          setp:lastReachedPosition>=100?4:gameState?.step
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
          noOfCorrectChoosen,
          noOfWrongChoosen,
          decisionImpact:lastReachedPosition,
          setp:lastReachedPosition>=100?4:gameState?.step
         })
  }
     


  if(gameState.isValueBuddyQuestion ){

    try {
      // Perform the query
      const valueBuddyQuestion = await db.ValueBuddyQuestion.findOne({
        where: { SuborganisationId: suborgId ,gateNumber:index},
      });
      if(valueBuddyQuestion){
        const valueBuddyOptions = await db.ValueBuddyOption.findAll({
          where: {ValueBuddyQuestionId:valueBuddyQuestion.id},
        });
      question={
      id:valueBuddyQuestion.id,
      question:valueBuddyQuestion?.question,
      index:index-1,
      options:valueBuddyOptions?.map(ele=>({id:ele.id,option:ele.option}))
    }
    }

    } catch (error) {
      throw new Error('Failed to retrieve ValueBuddy question: ' + error.message);
    }
  }
  if(lastReachedPosition>=100 && !gameState.isValueBuddyQuestion ){
    let gameState = await db.GameState.findOne({ where: { gameId, userId } });
     await gameState.update({step:4})
  }

  let karmaFlag=null;
  if(noOfKarmas<reachedKarmas){
    karmaFlag=1
  }else if(noOfKarmas>reachedKarmas){
    karmaFlag=0
  }

   
       return {diceResult:gameState?.lastDiceCount,from,lastReachedPosition:gameState.lastReachedPosition,
        question, noOfKarmas:gameState.noOfKarmas,totalScore,karmaFlag,addedKarmas,removedKarmas}
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
      const {diceResult,from,lastReachedPosition,question,noOfKarmas,totalScore,karmaFlag,addedKarmas,removedKarmas}=await handleRollDice(gameId,userId,'$', suborgId, false,-1,null)
  
      // Emit the dice-rolled event to the specific game room identified by gameId
      io.to(gameId).emit('dice-rolled', { gameId, diceResult, from ,lastReachedPosition,
        question,noOfKarmas ,totalScore,karmaFlag,refreshed:true,addedKarmas,removedKarmas});
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
      
        const {diceResult,from,lastReachedPosition,question,noOfKarmas,totalScore,karmaFlag,addedKarmas,removedKarmas}=await handleRollDice(gameId,userId,diceValue, suborgId,false,-1,null)
  
        // Emit the dice-rolled event to the specific game room identified by gameId
        io.to(gameId).emit('dice-rolled', { gameId, diceResult,from,lastReachedPosition,
          question,noOfKarmas,totalScore,karmaFlag,addedKarmas,removedKarmas });
      } catch (error) {
        console.error('Error rolling dice:', error);
      }
    });
  

 socket.on('handle-valuebuddy-question',async ({gameId,questionId,optionId})=>{
 //check the option value add it lastreachdPosition and update lastCrossedGatePositon
 try {

  const userId = socket.user.id;
  const suborgId=socket.user.SuborganisationId;

  const valueBuddyQuestion = await db.ValueBuddyQuestion.findOne({
    where: { SuborganisationId: suborgId ,id:questionId},
  });
  const valueBuddyOption = await db.ValueBuddyOption.findOne({
    where: { id:optionId,ValueBuddyQuestionId:questionId},
  });

  const {count}=await db.Game.findAndCountAll({where:{UserId:userId}});
 
  await db.ValueBuddyResponse.create({
    ValueBuddyQuestionId:questionId,
    ValueBuddyOptionId:optionId,
    SuborganisationId: suborgId,
    GameId:gameId,
    UserId:userId,
    attempt:`attempt-${count}`
  })
 
  const value=valueBuddyOption?.value;
  const isCorrect=value<0?false:true;
  const movePositionTo=valueBuddyOption?.movePosition
  const metaInfo=valueBuddyOption?.metaInfo;
 
  const {diceResult,
        from,lastReachedPosition,question,
        noOfKarmas,totalScore,karmaFlag,
        addedKarmas,removedKarmas}=await handleRollDice(gameId,userId,value, suborgId,true,movePositionTo,isCorrect);
 
 
    io.to(gameId).emit('dice-rolled', { 
        gameId,from,lastReachedPosition,noOfKarmas,question, 
        choosenOptionResult:{optionId,isCorrect,metaInfo} ,
        totalScore,karmaFlag,addedKarmas,removedKarmas
      });


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
