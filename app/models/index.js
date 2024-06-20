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
  attempt:DataTypes.STRING
});

// Define FeedbackQuestion model
const FeedbackQuestion = sequelize.define('FeedbackQuestion', {
  question: DataTypes.STRING
});

// Define FeedbackResponse model
const FeedbackResponse = sequelize.define('FeedbackResponse', {
  response: DataTypes.STRING,
  valueBuddy: DataTypes.STRING,
  attempt:DataTypes.STRING
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
  attempt:DataTypes.STRING
});

// Define ValueBuddyQuestions model
const ValueBuddyQuestion = sequelize.define('ValueBuddyQuestion', {
  question: DataTypes.STRING(999),
  gateNumber:DataTypes.INTEGER,
  valueBuddy:DataTypes.STRING
});

const ValueBuddyOption = sequelize.define('ValueBuddyOption', {
  option: DataTypes.STRING,
  value:DataTypes.INTEGER,
  metaInfo:DataTypes.STRING,
  movePosition:DataTypes.INTEGER

});

const ValueBuddyResponse = sequelize.define('ValueBuddyResponse', {
  attempt:DataTypes.STRING

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

const UtilAssets = sequelize.define('UtilAssets', {
setuLogo:DataTypes.STRING,
signature:DataTypes.STRING,
nextIcon:DataTypes.STRING,
prevIcon:DataTypes.STRING,
skipImg:DataTypes.STRING,
settingIcon:DataTypes.STRING,
closeIcon:DataTypes.STRING,
profileIcon:DataTypes.STRING,
audioIcon:DataTypes.STRING,
muteIcon:DataTypes.STRING,
infoIcon:DataTypes.STRING,
logoutIcon:DataTypes.STRING,
userIcon:DataTypes.STRING,
modalBg:DataTypes.STRING,
dashboardBg:DataTypes.STRING,
singlePlayer:DataTypes.STRING,
multiPlayer:DataTypes.STRING,
feedbackBg:DataTypes.STRING,
fbIcon1:DataTypes.STRING,
fbIcon2:DataTypes.STRING,
fbIcon3:DataTypes.STRING,
fbIcon4:DataTypes.STRING,
fbIcon5:DataTypes.STRING,
fbIcon6:DataTypes.STRING,
fbQuestionBg:DataTypes.STRING,
pollBg:DataTypes.STRING,
pollQuestionBg:DataTypes.STRING,
pollOptionBg:DataTypes.STRING,
certificateImg:DataTypes.STRING,
downloadIcon:DataTypes.STRING,
otpSuccess:DataTypes.STRING,
forgotPassword:DataTypes.STRING,
updateSuccess:DataTypes.STRING,
gameMusic:DataTypes.STRING,
diceRollSound:DataTypes.STRING,
tokenSound:DataTypes.STRING,
gateOpenSound:DataTypes.STRING,
wonPointSound:DataTypes.STRING,
lostPointSound:DataTypes.STRING,
snakeSound:DataTypes.STRING,
gameFinish:DataTypes.STRING,

});

const IntroAssets=sequelize.define('IntroAssets',{
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
})

const TokenAssets=sequelize.define('TokenAssets',{
tokenIcon1:DataTypes.STRING,
tokenIcon2:DataTypes.STRING,
tokenIcon3:DataTypes.STRING,
tokenIcon4:DataTypes.STRING,
tokenIcon5:DataTypes.STRING,
tokenIcon6:DataTypes.STRING,
tokenCard1:DataTypes.STRING,
tokenCard2:DataTypes.STRING,
tokenCard3:DataTypes.STRING,
tokenCard4:DataTypes.STRING,
tokenCard5:DataTypes.STRING,
tokenCard6:DataTypes.STRING,
})
const ValueBuddyAssets=sequelize.define('ValueBuddyAssets',{
 vb1:DataTypes.STRING,
vbHappy1:DataTypes.STRING,
vbSad1:DataTypes.STRING,
vbThumb1:DataTypes.STRING,
vb2:DataTypes.STRING,
vbHappy2:DataTypes.STRING,
vbSad2:DataTypes.STRING,
vbThumb2:DataTypes.STRING,
vb3:DataTypes.STRING,
vbHappy3:DataTypes.STRING,
vbSad3:DataTypes.STRING,
vbThumb3:DataTypes.STRING,
vb4:DataTypes.STRING,
vbHappy4:DataTypes.STRING,
vbSad4:DataTypes.STRING,
vbThumb4:DataTypes.STRING,
vb5:DataTypes.STRING,
vbHappy5:DataTypes.STRING,
vbSad5:DataTypes.STRING,
vbThumb5:DataTypes.STRING,
vb6:DataTypes.STRING,
vbHappy6:DataTypes.STRING,
vbSad6:DataTypes.STRING,
vbThumb6:DataTypes.STRING,
vb7:DataTypes.STRING,
vbHappy7:DataTypes.STRING,
vbSad7:DataTypes.STRING,
vbThumb7:DataTypes.STRING,
vb8:DataTypes.STRING,
vbHappy8:DataTypes.STRING,
vbSad8:DataTypes.STRING,
vbThumb8:DataTypes.STRING,
vb9:DataTypes.STRING,
vbHappy9:DataTypes.STRING,
vbSad9:DataTypes.STRING,
vbThumb9:DataTypes.STRING,
vb10:DataTypes.STRING,
vbHappy10:DataTypes.STRING,
vbSad10:DataTypes.STRING,
vbThumb10:DataTypes.STRING,
vb11:DataTypes.STRING,
vbHappy11:DataTypes.STRING,
vbSad11:DataTypes.STRING,
vbThumb11:DataTypes.STRING,
vb12:DataTypes.STRING,
vbHappy12:DataTypes.STRING,
vbSad12:DataTypes.STRING,
vbThumb12:DataTypes.STRING,
vb13:DataTypes.STRING,
vbHappy13:DataTypes.STRING,
vbSad13:DataTypes.STRING,
vbThumb13:DataTypes.STRING,
vb14:DataTypes.STRING,
vbHappy14:DataTypes.STRING,
vbSad14:DataTypes.STRING,
vbThumb14:DataTypes.STRING,
vb15:DataTypes.STRING,
vbHappy15:DataTypes.STRING,
vbSad15:DataTypes.STRING,
vbThumb15:DataTypes.STRING,
vb16:DataTypes.STRING,
vbHappy16:DataTypes.STRING,
vbSad16:DataTypes.STRING,
vbThumb16:DataTypes.STRING,
})
const DiceAssets=sequelize.define('DiceAssets',{
dice:DataTypes.STRING,
dice1:DataTypes.STRING,
dice2:DataTypes.STRING,
dice3:DataTypes.STRING,
dice4:DataTypes.STRING,
dice5:DataTypes.STRING,
dice6:DataTypes.STRING,
})

const GameAssets=sequelize.define('GameAssets',{
  gameBg:DataTypes.STRING,
  gameboardBg:DataTypes.STRING,
  gateImage:DataTypes.STRING,
  scoreBoard:DataTypes.STRING,
  barometer:DataTypes.STRING,
  decisionImpactHeading:DataTypes.STRING,
  badgemeter:DataTypes.STRING,
  karmaHeading:DataTypes.STRING,
  serpentImg:DataTypes.STRING,
  magnusImg:DataTypes.STRING,
  badge1:DataTypes.STRING,
  badge2:DataTypes.STRING,
  badge3:DataTypes.STRING,
  badge4:DataTypes.STRING,
  badge5:DataTypes.STRING,
  learningIcon:DataTypes.STRING,
  companyLogo:DataTypes.STRING,
  settingsIcon:DataTypes.STRING,
  setuLogo_white:DataTypes.STRING,
  tokenBg:DataTypes.STRING,
  leftPanelBg:DataTypes.STRING,
  goodGateImg:DataTypes.STRING,
  badGateImg:DataTypes.STRING,
  magnusGivingImg:DataTypes.STRING,
  magnusTakingImg:DataTypes.STRING,
  goodPathAnimation:DataTypes.STRING,
  badPathAnimation:DataTypes.STRING,
  questionBg:DataTypes.STRING,
  serpentAnimation:DataTypes.STRING,
  optionBg:DataTypes.STRING,
  metaInfoBg:DataTypes.STRING,
  magnusFinalImg:DataTypes.STRING,

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


UtilAssets.belongsTo(Suborganisation);
IntroAssets.belongsTo(Suborganisation);
TokenAssets.belongsTo(Suborganisation);
ValueBuddyAssets.belongsTo(Suborganisation);
DiceAssets.belongsTo(Suborganisation);
GameAssets.belongsTo(Suborganisation);


GameConfiguration.belongsTo(Suborganisation);

Logs.belongsTo(User);
Logs.belongsTo(Suborganisation);

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
db.UtilAssets=UtilAssets;
db.IntroAssets=IntroAssets;
db.TokenAssets=TokenAssets;
db.ValueBuddyAssets=ValueBuddyAssets;
db.DiceAssets=DiceAssets;
db.GameConfiguration=GameConfiguration;
db.GameAssets=GameAssets;
db.Otp=Otp;
db.Logs=Logs;
// db.Assets=Assets;

module.exports = db;
