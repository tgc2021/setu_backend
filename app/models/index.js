const dbConfig = require("../config/db.config.js");

const {Sequelize ,DataTypes}= require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,

  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;




// Define Organisation model
const Organisation = sequelize.define('Organisation', {
  name: DataTypes.STRING,
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true // Set default value to true
  },
  email:DataTypes.STRING,
  password:DataTypes.STRING,
  authByEmail:DataTypes.BOOLEAN,
  authByPhone:DataTypes.BOOLEAN
});

// Define Suborganisation model
const Suborganisation = sequelize.define('Suborganisation', {
  name: DataTypes.STRING,
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true // Set default value to true
  },
  email:DataTypes.STRING,
  password:DataTypes.STRING,
  authByEmail:DataTypes.BOOLEAN,
  authByPhone:DataTypes.BOOLEAN
});

// Define User model
const User = sequelize.define('User', {
  name: DataTypes.STRING,
  username:DataTypes.STRING,
  email: DataTypes.STRING,
  phone:DataTypes.STRING,
  password: DataTypes.STRING,
  city: DataTypes.STRING,
  firstTimeUser:   {
    type: DataTypes.BOOLEAN,
    defaultValue: true // Set default value to true
  },
  pendingGame: {
    type: DataTypes.INTEGER,
    defaultValue: null // Set default value to null
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true // Set default value to true
  }
});

// Define Game model
const Game = sequelize.define('Game', {
  startTime: DataTypes.DATE,
  endTime: DataTypes.DATE,
  type: DataTypes.ENUM('single', 'multiplayer')
});

// Define GameState model
const GameState = sequelize.define('GameState', {
  type: DataTypes.STRING,
  selectedToken: DataTypes.STRING,
  isValueBuddySelected: DataTypes.BOOLEAN,
  lastDiceCount: DataTypes.INTEGER,
  lastReachedPosition: DataTypes.INTEGER,
  lastCrossedGatePositon: DataTypes.INTEGER,
  noOfKarmas: DataTypes.INTEGER,
  decisionImpact: DataTypes.INTEGER,
  totalScore: DataTypes.INTEGER,
  sessionTime: DataTypes.INTEGER,
  noOfWrongChoosen: DataTypes.INTEGER,
  noOfCorrectChoosen: DataTypes.INTEGER,
  isValueBuddyQuestion:{
    type:DataTypes.BOOLEAN,
    defaultValue:false
  },
  step: {
    type: DataTypes.INTEGER,
    defaultValue: 1 // Set default value to null
  },
});

// Define FeedbackQuestion model
const FeedbackQuestion = sequelize.define('FeedbackQuestion', {
  question: DataTypes.STRING
});

// Define FeedbackResponse model
const FeedbackResponse = sequelize.define('FeedbackResponse', {
  response: DataTypes.TEXT
});

// Define PollQuestion model
const PollQuestion = sequelize.define('PollQuestion', {
  question: DataTypes.STRING
});

// Define PollOption model
const PollOption = sequelize.define('PollOption', {
  option: DataTypes.STRING
});

// Define PollResponse model
const PollResponse = sequelize.define('PollResponse', {
  response: DataTypes.TEXT
});

// Define ValueBuddyQuestions model
const ValueBuddyQuestion = sequelize.define('ValueBuddyQuestion', {
  questions: DataTypes.TEXT,
});

// Define Assets model
const Assets = sequelize.define('Assets', {

valueBuddies: {
  type: DataTypes.JSON, // Define gatePositions as an array of integers

},

tokens:  {
  type:  DataTypes.JSON,// Define token names as an array of strings


},

gatePositions: {
    type: DataTypes.JSON, // Define gatePositions as an array of integers
    
},
});

// Define Otp model

const Otp = sequelize.define('Otp', {
 otp:DataTypes.INTEGER,
 otpExpireTime:DataTypes.DATE,
 email:DataTypes.STRING,
 phone:DataTypes.STRING,
 type:DataTypes.ENUM('new_user', 'existing_user')
});


// Define associations between models
Suborganisation.belongsTo(Organisation);
Organisation.hasMany(Suborganisation);

User.belongsTo(Suborganisation);
Suborganisation.hasMany(User);

Game.belongsTo(User);
User.hasMany(Game);

GameState.belongsTo(User);
User.hasMany(GameState);

GameState.belongsTo(Game);
Game.hasMany(GameState);


FeedbackQuestion.belongsTo(Suborganisation);
Suborganisation.hasMany(FeedbackQuestion);

FeedbackResponse.belongsTo(FeedbackQuestion);
FeedbackQuestion.hasMany(FeedbackResponse);

FeedbackResponse.belongsTo(User);
User.hasMany(FeedbackResponse);

FeedbackResponse.belongsTo(Game);
Game.hasMany(FeedbackResponse);

FeedbackResponse.belongsTo(Suborganisation);
Suborganisation.hasMany(FeedbackResponse);

PollQuestion.belongsTo(Suborganisation);
Suborganisation.hasMany(PollQuestion);

PollOption.belongsTo(PollQuestion);
PollQuestion.hasMany(PollOption);

PollResponse.belongsTo(PollQuestion);
PollQuestion.hasMany(PollResponse);

PollResponse.belongsTo(PollOption);
PollOption.hasMany(PollResponse);

PollResponse.belongsTo(User);
User.hasMany(PollResponse);

PollResponse.belongsTo(Game);
Game.hasMany(PollResponse);

PollResponse.belongsTo(Suborganisation);
Suborganisation.hasMany(PollResponse);


ValueBuddyQuestion.belongsTo(Suborganisation);
Suborganisation.hasMany(ValueBuddyQuestion);

Assets.belongsTo(Suborganisation);
Assets.belongsTo(Organisation);



db.Organisation=Organisation;
db.Suborganisation=Suborganisation;
db.User=User;
db.Game=Game;
db.GameState=GameState;
db.FeedbackQuestion=FeedbackQuestion;
db.FeedbackResponse=FeedbackResponse;
db.PollQuestion=PollOption;
db.PollOption=PollOption;
db.PollResponse=PollResponse;
db.ValueBuddyQuestion=ValueBuddyQuestion;
db.Assets=Assets;
db.Otp=Otp;


module.exports = db;
