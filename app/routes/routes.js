const express = require('express');
const router = express.Router();
const assetsRoutes=require('../controllers/assetsController')
const organisationRoutes=require('../controllers/organisationController');
const suborganisationRoutes=require('../controllers/suborganisationController');
const userRoutes=require('../controllers/userController');
const gameRoutes=require('../controllers/gamePlayController');
const gameConfigurationRoutes=require('../controllers/gameConfigurationController');
const feedbackRoutes=require('../controllers/feedBackController')
const pollRoutes=require('../controllers/pollController');
const valueBuddyRoutes=require('../controllers/valueBuddyController')
const {authenticateJWT,checkSuborgExists}=require('../midllewares/authMiddleware');



module.exports = function(io) {
router.use('/assets',checkSuborgExists,assetsRoutes);
router.use('/gameConfiguration',gameConfigurationRoutes);
router.use('/valueBuddy',valueBuddyRoutes);
router.use('/organisation',organisationRoutes);
router.use('/suborganisation',suborganisationRoutes);
router.use('/user',userRoutes);
router.use('/game',authenticateJWT,gameRoutes(io));
router.use('/feedback',feedbackRoutes);
router.use('/poll',pollRoutes);
return router;
};
