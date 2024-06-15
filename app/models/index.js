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
  noOfWrongChoosen:{
    type: DataTypes.INTEGER,
    defaultValue: 0 // Set default value to 0
  },
  noOfCorrectChoosen: {
    type: DataTypes.INTEGER,
    defaultValue: 0 // Set default value to 0
  },
  isValueBuddyQuestion:{
    type:DataTypes.BOOLEAN,
    defaultValue:false
  },
  step: {
    type: DataTypes.INTEGER,
    defaultValue: 1 // Set default value to 1
  },
});

// Define FeedbackQuestion model
const FeedbackQuestion = sequelize.define('FeedbackQuestion', {
  question: DataTypes.STRING
});

// Define FeedbackResponse model
const FeedbackResponse = sequelize.define('FeedbackResponse', {
  response: DataTypes.STRING,
  valueBuddy: DataTypes.STRING
});

// Define PollQuestion model
const PollQuestion = sequelize.define('PollQuestion', {
  question: DataTypes.STRING,
});

// Define PollOption model
const PollOption = sequelize.define('PollOption', {
  option: DataTypes.STRING,

});

// Define PollResponse model
const PollResponse = sequelize.define('PollResponse', {

});

// Define ValueBuddyQuestions model
const ValueBuddyQuestion = sequelize.define('ValueBuddyQuestion', {
  question: DataTypes.STRING,
  gateNumber:DataTypes.INTEGER
});

const ValueBuddyOption = sequelize.define('ValueBuddyOption', {
  option: DataTypes.STRING,
  value:DataTypes.INTEGER,
  metaInfo:DataTypes.STRING,
  movePosition:DataTypes.INTEGER

});

const ValueBuddyResponse = sequelize.define('ValueBuddyResponse', {

 });

const SelectValueBuddy = sequelize.define('SelectValueBuddy', {
 attempt:DataTypes.STRING,
 isChoosenCorrect:DataTypes.BOOLEAN
});

const GameConfiguration=sequelize.define('GameConfiguration',{
  choosenValueBuddies: {
  type: DataTypes.JSON, // Define valuebuddies as an array of integers

},

tokens:  {
  type:  DataTypes.JSON,// Define token names as an array of strings
},

gatePositions: {
    type: DataTypes.JSON, // Define gatePositions as an array of integers
    
},
karmaPositions: {
  type: DataTypes.JSON, // Define gatePositions as an array of integers
  
},

valueBuddies: {
  type: DataTypes.JSON, // Define valuebuddies as an array of integers

},
})

// Define Assets model
const Assets = sequelize.define('Assets', {

logo:DataTypes.STRING,
introImg1:DataTypes.STRING,
introImg2:DataTypes.STRING,
introImg3:DataTypes.STRING,
introImg4:DataTypes.STRING,
introImg5:DataTypes.STRING,
introImg6:DataTypes.STRING,
introImg7:DataTypes.STRING,
introImg8:DataTypes.STRING,
introImg9:DataTypes.STRING,
introImg10:DataTypes.STRING,
introImg11:DataTypes.STRING,
introImg12:DataTypes.STRING,
introImg13:DataTypes.STRING,
introImg14:DataTypes.STRING,
introImg15:DataTypes.STRING,
signature:DataTypes.STRING
});

const Logs = sequelize.define('Logs', {

  loggedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW, // Set default value to current timestamp
    allowNull: false,
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

Game.belongsTo(Suborganisation);
Suborganisation.hasMany(Game);




GameState.belongsTo(User);
User.hasMany(GameState);

GameState.belongsTo(Game);
Game.hasMany(GameState);

SelectValueBuddy.belongsTo(User)
User.hasMany(SelectValueBuddy)

SelectValueBuddy.belongsTo(Game)
Game.hasMany(SelectValueBuddy)

SelectValueBuddy.belongsTo(Suborganisation);
Suborganisation.hasMany(SelectValueBuddy);

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


PollQuestion.hasMany(PollOption,{ onDelete: 'CASCADE', hooks: true });
PollOption.belongsTo(PollQuestion);

PollOption.belongsTo(Suborganisation)
Suborganisation.hasMany(PollOption)

PollResponse.belongsTo(PollQuestion);
PollQuestion.hasMany(PollResponse);

PollResponse.belongsTo(PollOption);
PollOption.hasMany(PollResponse)

PollResponse.belongsTo(User);
User.hasMany(PollResponse);

PollResponse.belongsTo(Game);
Game.hasMany(PollResponse);

PollResponse.belongsTo(Suborganisation);
Suborganisation.hasMany(PollResponse);


ValueBuddyQuestion.belongsTo(Suborganisation);
Suborganisation.hasMany(ValueBuddyQuestion);

ValueBuddyOption.belongsTo(ValueBuddyQuestion)
ValueBuddyQuestion.hasMany(ValueBuddyOption,{ onDelete: 'CASCADE', hooks: true })

ValueBuddyResponse.belongsTo(ValueBuddyQuestion)
ValueBuddyQuestion.hasMany(ValueBuddyResponse)

ValueBuddyResponse.belongsTo(ValueBuddyOption)
ValueBuddyOption.hasMany(ValueBuddyResponse)

ValueBuddyResponse.belongsTo(Game);
Game.hasMany(ValueBuddyResponse);

ValueBuddyResponse.belongsTo(User);
User.hasMany(ValueBuddyResponse);

ValueBuddyResponse.belongsTo(Suborganisation);
Suborganisation.hasMany(ValueBuddyResponse);


Assets.belongsTo(Suborganisation);

GameConfiguration.belongsTo(Suborganisation);

Logs.belongsTo(User)
User.hasMany(Logs)

db.Organisation=Organisation;
db.Suborganisation=Suborganisation;
db.User=User;
db.Game=Game;
db.SelectValueBuddy=SelectValueBuddy;
db.GameState=GameState;
db.FeedbackQuestion=FeedbackQuestion;
db.FeedbackResponse=FeedbackResponse;
db.PollQuestion=PollQuestion;
db.PollOption=PollOption
db.PollResponse=PollResponse;
db.ValueBuddyQuestion=ValueBuddyQuestion;
db.ValueBuddyOption=ValueBuddyOption;
db.ValueBuddyResponse=ValueBuddyResponse;
db.Assets=Assets;
db.GameConfiguration=GameConfiguration;
db.Otp=Otp;
db.Logs=Logs

module.exports = db;
