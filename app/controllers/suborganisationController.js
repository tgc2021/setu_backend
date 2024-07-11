// suborganisationRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op,Sequelize } = require('sequelize');


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
    //console.log('orgId',req.query.id)
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

      const introAssetsData = await db.IntroAssets.findOne({where:{SuborganisationId:suborganisation.id}});
      const valueBuddyAssetsData = await db.ValueBuddyAssets.findOne({where:{SuborganisationId:suborganisation.id}});
      const tokenAssetsData = await db.TokenAssets.findOne({where:{SuborganisationId:suborganisation.id}});
      const diceAssetsData = await db.DiceAssets.findOne({where:{SuborganisationId:suborganisation.id}});
      const gameAssetsData = await db.GameAssets.findOne({where:{SuborganisationId:suborganisation.id}});
      const utilAssetsData = await db.UtilAssets.findOne({where:{SuborganisationId:suborganisation.id}});
      const audioAssetsData = await db.AudioAssets.findOne({where:{SuborganisationId:suborganisation.id}});
      const chroAssetsData = await db.ChroAssets.findOne({where:{SuborganisationId:suborganisation.id}});
      const valueBuddyDescData = await db.ValueBuddyDesc.findOne({where:{SuborganisationId:suborganisation.id}});
      if (!introAssetsData ) {
        return res.status(404).json({ type:'error',message: 'Assets not found for the given suborganisation.' });
      
      }
  const removedColumn=["id","createdAt","updatedAt","SuborganisationId"];
     const introAssets = [];
     if(introAssetsData?.dataValues){
  for (const key in introAssetsData.dataValues) {
    if (!removedColumn.includes(key)) {
      if( typeof introAssetsData[key]==='string')
      introAssets.push(introAssetsData[key]?.replace(/\\/g, '/'));
      else
      introAssets.push(introAssetsData[key]);
    
    }
  }
}
    
  const tokenIconAssets = [];
  const tokenCardAssets = [];
  if(tokenAssetsData?.dataValues){
  for (const key in tokenAssetsData.dataValues) {
    if (!removedColumn.includes(key)) {
      if(key.startsWith("tokenCard")){
        if( typeof tokenAssetsData[key]==='string')
        tokenCardAssets.push(tokenAssetsData[key]?.replace(/\\/g, '/'));
      else
        tokenCardAssets.push(tokenAssetsData[key]);
    }else if(key.startsWith("tokenIcon")){
      if( typeof tokenAssetsData[key]==='string')
      tokenIconAssets.push(tokenAssetsData[key]?.replace(/\\/g, '/'));
    else
    tokenIconAssets.push(tokenAssetsData[key]);
    }
  }
  }
}

  const valueBuddyAssets = [];
  if(valueBuddyAssetsData?.dataValues){
  for (const key in valueBuddyAssetsData.dataValues) {
    if (!removedColumn.includes(key)) {
      if( typeof valueBuddyAssetsData[key]==='string')
      valueBuddyAssets.push(valueBuddyAssetsData[key]?.replace(/\\/g, '/'));
    else
    valueBuddyAssets.push(valueBuddyAssetsData[key]);
    }
  }
  }

  const valueBuddyDesc = [];
  if(valueBuddyDescData?.dataValues){
  for (const key in valueBuddyDescData.dataValues) {
    if (!removedColumn.includes(key)) {
    valueBuddyDesc.push(valueBuddyDescData[key]);
    }
  }
  }

  const diceAssets = [];
  if(diceAssetsData?.dataValues){
  for (const key in diceAssetsData.dataValues) {
    if (!removedColumn.includes(key)) {
      if( typeof diceAssetsData[key]==='string')
      diceAssets.push(diceAssetsData[key]?.replace(/\\/g, '/'));
    else
     diceAssets.push(diceAssetsData[key]);
    }
  }
}
let gameAssets={}
if (gameAssetsData?.dataValues) {
  Object.keys(gameAssetsData.dataValues).forEach(key => {
    if (!removedColumn.includes(key)) {
      if( typeof gameAssetsData[key]==='string')
    gameAssets[key] =gameAssetsData[key]?.replace(/\\/g, '/');
  else
  gameAssets[key] =gameAssetsData[key];

    }
  });
}

let utilAssets={}
if (utilAssetsData?.dataValues) {
  Object.keys(utilAssetsData.dataValues).forEach(key => {
    if (!removedColumn.includes(key)) {
      if( typeof utilAssetsData[key]==='string')
    utilAssets[key] =utilAssetsData[key]?.replace(/\\/g, '/');
    else
    utilAssets[key] =utilAssetsData[key];
  }
  });
}

let audioAssets={}
if (audioAssetsData?.dataValues) {
  Object.keys(audioAssetsData.dataValues).forEach(key => {
    if (!removedColumn.includes(key)) {
      if( typeof audioAssetsData[key]==='string')
    audioAssets[key] =audioAssetsData[key]?.replace(/\\/g, '/');
  else
  audioAssets[key] =audioAssetsData[key];
    }
  });
}

let chroAssets={}

if (chroAssetsData?.dataValues) {
  Object.keys(chroAssetsData.dataValues).forEach(key => {
    if (!removedColumn.includes(key) ) {
   if( typeof chroAssetsData[key]==='string'){
    chroAssets[key] =chroAssetsData[key]?.replace(/\\/g, '/');
    }else{
      chroAssets[key] =chroAssetsData[key];
    }
  }
  });
}



      res.json({id:suborganisation.id,
         configuredAuth,
         introAssets,
         tokenIconAssets,
         tokenCardAssets,
         valueBuddyAssets,
         diceAssets,
         gameAssets,
         utilAssets,
         audioAssets,
         chroAssets,
         valueBuddyDesc
      });
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

router.get('/leader-board', async(req,res)=>{
  try {
    const {suborgId}=req.query;
    const suborganisation = await db.Suborganisation.findByPk(suborgId);
    if (!suborganisation) {
      res.status(404).json({ message: 'Suborganisation not found' });
    }
    const results = await db.GameState.findAll({
      attributes: [
        'UserId',
        [Sequelize.fn('SUM', Sequelize.col('totalScore')), 'totalScoreSum']
      ],
      where: {
        type: 'single',
        SuborganisationId:suborgId,
        step: {
          [Sequelize.Op.gt]: 3
        }
      },
      include: [{
        model: db.User,
        attributes: ['name', 'username','email','phone','city']
      }],
      group: ['UserId', 'User.id', 'User.name', 'User.username','User.email','User.phone','User.city'], // Group by all selected fields in User model
      order: [
        [Sequelize.literal('totalScoreSum'), 'DESC'],
        [db.User, 'name', 'ASC']
      ]
    });

    return res.json({data:results });
  } catch (error) {
    console.error('Error executing query:', error);
  }
})


module.exports = router;
