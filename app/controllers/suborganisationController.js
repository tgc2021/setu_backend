// suborganisationRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../models');

// Create a new suborganisation
router.post('/create', async (req, res) => {
  try {
    const requiredFields = ['name','OrganisationId','email','password'];

    // Check for missing fields
    const missingFields = requiredFields.filter(field => !req.body[field]);
  
    if (missingFields.length > 0) {
        return res.status(400).json({ message: `The following fields are missing: ${missingFields.join(', ')}` });
    }

    const organisation = await db.Organisation.findByPk(req.body.organisationId);
    if (organisation === null) {
      res.status(404).json({type:'error', message: 'Organisation not found' });
    } 
    const createData={
        name:req.body.name,
        isActive:req.body?.isActive,
        OrganisationId:req.body.organisationId,
        email:req.body.email,
        password:req.body.password
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
router.get('/:id', async (req, res) => {

  try {
    console.log('orgId',req.params.id)
    const suborganisation = await db.Suborganisation.findByPk(req.params.id);
    if (suborganisation === null) {
      res.status(404).json({ type:'error',message: 'Organisation/Suborganisation not found' });
    } else {
      res.json({organisationId:suborganisation.id});
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
        const {name,isActive,organisationId,email,password}=req.body;
        const updateData={
          name:name,
          isActive:isActive,
          OrganisationId:organisationId,
          email:email,
          password:password
          
        }
        if(!name||!isActive||!organisationId||!email||!password){
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
router.delete('/:id', async (req, res) => {
  try {
    const suborganisation = await db.Suborganisation.findByPk(req.params.id);
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

module.exports = router;
