// organisationRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../models');

// Create a new organisation
router.post('/create', async (req, res) => {
  try {
    const requiredFields = ['name','email','password','authByEmail','authByPhone'];

    // Check for missing fields
    const missingFields = requiredFields.filter(field => !req.body[field]);
  
    if (missingFields.length > 0) {
        return res.status(400).json({ message: `The following fields are missing: ${missingFields.join(', ')}` });
    }

    const createData={
        name:req.body.name,
        isActive:req.body?.isActive,
        email:req.body.email,
        password:req.body.password,
        authByEmail:req.body.authByEmail,
        authByPhone:req.body.authByPhone
    }
 
    const organisation = await db.Organisation.create(createData);

    const createSubData={
      name:req.body.name,
      OrganisationId:organisation.id,
      email:req.body.email,
      password:req.body.password,
      authByEmail:req.body.authByEmail,
      authByPhone:req.body.authByPhone
  }
    const suborganisation = await db.Suborganisation.create(createSubData);
    res.status(201).json({message:'Organisation created successfully.',suborganisation})
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read all organisations
router.get('/getAll', async (req, res) => {
  try {
    const organisations = await db.Organisation.findAll();
    res.json(organisations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read an organisation by ID
router.get('/:id', async (req, res) => {
  try {
    const organisation = await db.Organisation.findByPk(req.params.id);
    if (organisation === null) {
      res.status(404).json({type:'error', message: 'Organisation not found' });
    } else {
      res.json({"organisationId":organisation.id});
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
//check organisation or suborgnaisation 
// router.get('/check/:id', async (req, res) => {
//   try {
//     // Check if the id exists in the Organisation table
//     const organisation = await db.Organisation.findByPk(req.params.id);
    
//     if (organisation !== null) {
//       res.json({"organisationId":organisation.id});
//       return; // Exit the function early if found in Organisation table
//     }
    
//     // If not found in Organisation table, check in Suborganisation table
//     const suborganisation = await db.Suborganisation.findByPk(req.params.id);
    
//     if (suborganisation !== null) {
//       res.json({"organisationId":suborganisation.id});
//       return; // Exit the function early if found in Suborganisation table
//     }

//     // If not found in either table, return a 404 response
//     res.status(404).json({type:'error', message: 'Organisation not found!' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });


// Update an organisation by ID
router.patch('/update/:id', async (req, res) => {
  try {
    const organisation = await db.Organisation.findByPk(req.params.id);
    if (organisation === null) {
      res.status(404).json({ message: 'Organisation not found' });
    } else {
      const {name,isActive}=req.body;
      const updateData={
        name:name,
        isActive:isActive
      }
      if(!name||!isActive){
        return res.status(400).json({ message: `Nothing to update..!` });
      }

      await organisation.update(updateData);
      res.status(201).json({message:'Organisation updated successfully.',organisation})
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete an organisation by ID
router.delete('/:id', async (req, res) => {
  try {
    const organisation = await db.Organisation.findByPk(req.params.id);
    if (organisation === null) {
      res.status(404).json({ message: 'Organisation not found' });
    } else {
      await organisation.destroy();
      res.json({ message: 'Organisation deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
