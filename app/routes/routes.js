const express = require('express');
const router = express.Router();
const organisationRoutes=require('../controllers/organisationController');
const suborganisationRoutes=require('../controllers/suborganisationController');
const userRoutes=require('../controllers/userController');
const gameRoutes=require('../controllers/gamePlayController');
const assetRoutes=require('../controllers/assetController')
const {authenticateJWT}=require('../midllewares/authMiddleware');



module.exports = function(io) {

router.use('/organisation',organisationRoutes);
router.use('/suborganisation',suborganisationRoutes);
router.use('/user',userRoutes);
router.use('/game',authenticateJWT,gameRoutes(io));
router.use('/assets',assetRoutes);


return router;
};
