const express = require('express');
const router = express.Router();
const organisationRoutes=require('../controllers/organisationController');
const suborganisationRoutes=require('../controllers/suborganisationController');
const userRoutes=require('../controllers/userController');
const gameRoutes=require('../controllers/gamePlayController');
const assetRoutes=require('../controllers/assetController');
const feedbackRoutes=require('../controllers/feedBackController')
const pollRoutes=require('../controllers/pollController')
const {authenticateJWT}=require('../midllewares/authMiddleware');



module.exports = function(io) {

router.use('/organisation',organisationRoutes);
router.use('/suborganisation',suborganisationRoutes);
router.use('/user',userRoutes);
router.use('/game',authenticateJWT,gameRoutes(io));
router.use('/assets',assetRoutes);
router.use('/feedback',feedbackRoutes);
router.use('/poll',pollRoutes);
return router;
};
