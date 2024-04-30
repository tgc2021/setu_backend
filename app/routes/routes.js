const express = require('express');
const router = express.Router();
const organisationRoutes=require('../controllers/organisationController');
const suborganisationRoutes=require('../controllers/suborganisationController');
const userRoutes=require('../controllers/userController')





router.use('/organisation',organisationRoutes);
router.use('/suborganisation',suborganisationRoutes);
router.use('/user',userRoutes);

module.exports = router;