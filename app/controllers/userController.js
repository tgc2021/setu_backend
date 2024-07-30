// userRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../models');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');
const axios=require('axios')
const https = require('https');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const excel = require('exceljs');
const { authenticateJWT, checkSuborgExists } = require('../midllewares/authMiddleware');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const agent = new https.Agent({
    rejectUnauthorized: false
});
// Overview data 
router .get('/overview',authenticateJWT, async (req, res) => {
 

  try {
    // Fetch user-related data for the specified user ID
    const userId = req.user.id;
    const suborgId=req.user.SuborganisationId;
        // Validate suborganisationId
    if (!suborgId) {
          return res.status(400).json({ message: 'suborganisation id is required.' });
      }
    const user = await db.User.findOne({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({type:'error', error: 'User not found' });
    }


      let step=-3;
    if(user?.pendingGame){
      step=0;
    }else if(!user?.firstTimeUser){
       step=-1;
    }

  

        // Check if the Game Configuration exists
        const gameConfiguration = await db.GameConfiguration.findOne({where:{SuborganisationId:suborgId}});
      
        const valueBuddyQuestion=await db.ValueBuddyQuestion.findAll({where:{SuborganisationId:suborgId}});
        const feedback=await db.FeedbackQuestion.findOne({where:{SuborganisationId:suborgId}});
        const poll=await db.PollQuestion.findOne({where:{SuborganisationId:suborgId}});
        if (!gameConfiguration || !valueBuddyQuestion || valueBuddyQuestion && valueBuddyQuestion.length!=16 || !poll || !feedback) {
            return res.status(404).json({ message: 'Game configuration not found for given organisation/suborganisation.' });
        }
    


    res.json({type:'success',
     step, 
    "correctValueBuddies":(gameConfiguration?.choosenValueBuddies),
    "tokens":(gameConfiguration?.tokens),
    "valueBuddies":(gameConfiguration?.valueBuddies),
    "gatePositions":(gameConfiguration?.gatePositions),
    "karmaPostions":(gameConfiguration?.karmaPostions),
    "name":user.name,
    "username":user.username,
    "email":user.email,
    "phone":user.phone,
    "city":user.city
  });

  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create a new user
router.post('/register', async (req, res) => {
  try {
    const { name, username, password, city,suborganisationId,otp,uniqueId } = req.body;
    const requiredFields = ['name','username','password','city','otp','uniqueId'];
    let email,phone;
    // Check for missing fields
    const missingFields = requiredFields.filter(field => !req.body[field]);
  
    if (missingFields.length > 0) {
        return res.status(400).json({type:'error', message: `The following fields are missing: ${missingFields.join(', ')}` });
    }
    
    const suborganisation = await db.Suborganisation.findByPk(suborganisationId);
    if(!suborganisation){
        return res.status(404).json({type:'error',message:'Organisation not found!'})
    }

    const isOtpVerified=await verifyOtp(uniqueId,otp,true);

    if(!isOtpVerified){
    
    return res.status(403).json({ type:'error', message: "OTP verification failed" });
        
    }

    if (/^\S+@\S+\.\S+$/.test(uniqueId)) {
        email = uniqueId;
      } else {
        phone =uniqueId;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

    const createData={
        name,
        isActive:req.body?.isActive,
        SuborganisationId:suborganisationId,
        email,
        phone,
        password: hashedPassword,
        city,
        username

    }


    const user = await db.User.create(createData);
    res.json({type:'success',message:" User registered successfully!"});
  } catch (error) {
    res.status(500).json({ type:'error', message: error.message });
  }
});

//login user
router.post('/login', async (req, res) => {
    const { username, password ,suborgId} = req.body;
    if (!username || !password ) {
        return res.status(400).json({type:'error', message: 'Username and password are required' });
      }


    try {

      if(!suborgId || suborgId && !await db.Suborganisation.findByPk(suborgId)){
        return res.status(400).json({type:'error', message: 'Suborgnisation not found!' });
      }
      // Find user by username or email
      const user = await db.User.findOne({ where: { username,SuborganisationId:suborgId } });
  
    
      // Check if user exists
      if (!user ) {
        return res.status(404).json({type:'error', message: 'User not found' });
      }
  
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
  
      if (!isPasswordValid) {
        return res.status(401).json({type:'error', message: 'Invalid password' });
      }
      if(user.isActive==0){
        return res.status(401).json({type:'error', message: 'You have been blocked by the organisation!' });
      }
  
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, phone: user.phone,pendingGame:user.pendingGame,suborgId:user.SuborganisationId },
        process.env.JWT_SECRET,
        { expiresIn: '1d' } // Set expiry to 1 day
      );

     const log = await db.Logs.create({UserId:user.id,SuborganisationId:user.SuborganisationId});
      // Send JWT token as response
      res.json({type:'success', message: 'Login successful', token,firstTimeUser:user?.firstTimeUser });
    } catch (error) {
      res.status(500).json({type:'error', message: error.message });
    }
  });

// Update a user by ID
router.patch('/update/:id', authenticateJWT,async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({type:'error', message: 'User not found' });
    }
    const { name, password, city } = req.body;
    await user.update({ name, email, phone, password, city, firstTimeUser, pendingGame });
    res.json({type:'success',message:"User details updated successfully!",user});
  } catch (error) {
    res.status(500).json({type:'error', message: error.message });
  }
});

// Read all users
router.get('/getAll', authenticateJWT, async (req, res) => {
  try {
    const users = await db.User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read a user by ID
router.get('/',authenticateJWT, async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Check if a username exists
router.get('/checkUserName/:suborgId/:username',  async (req, res) => {
  const { username,suborgId } = req.params;

  try {
    // Query the database to check if the username exists
    const existingUser = await db.User.findOne({ where: { username ,SuborganisationId:suborgId} });

    // If the user exists, send true; otherwise, send false
    res.json({ exists: !!existingUser });
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//update password

router.patch('/updatePassword',async (req, res) => {
    const { new_password, confirm_password,uniqueId,suborgId} = req.body;
    
  
    try {
      // Find the user by ID
      const user = await getUserDetails(uniqueId,suborgId);
  
      // Check if the user exists
      if(!suborgId || suborgId && !await db.Suborganisation.findByPk(suborgId)){
        return res.status(400).json({type:'error', message: 'Suborgnisation not found!' });
      }
      // Check if user exists
      if (!user ) {
        return res.status(404).json({type:'error', message: 'User not found' });
      }
      if(user.isActive==0){
        return res.status(401).json({type:'error', message: 'You have been blocked by the organisation!' });
      }
  
  
      // Verify new and confirm passwords
      if (new_password !== confirm_password) {
        return res.status(400).json({type:'error', message: 'New password and confirm password do not match' });
      }


      // Check if the user exists and the OTP matches
      const otp = await db.Otp.findOne({ where: { email: uniqueId }, order: [['createdAt', 'DESC']] });
  

     // console.log(otp)
      if( otp && new Date(otp.otpExpireTime) < new Date()){
        return res.status(400).json({type:'error', message: 'Session expired!' });
      }
  
      const salt = await bcrypt.genSalt(10);
      const hashedNewPassword= await bcrypt.hash(new_password , salt);
  
      // Update the user's password
      await user.update({ password: hashedNewPassword });
  
      // Send success response
      res.json({type:'success', message: 'Password updated successfully!' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });



  const sendOtp = async (uniqueId,orgId,newUser=false) => {
    try {
      // Check if the unique ID is a phone number
      const isPhoneNumber =  /^(\+).*$/.test(uniqueId);

  
      // Send OTP via SMS if it's a phone number, otherwise send via email
      if (isPhoneNumber) {
        // Make an HTTP POST request to the OTP sending API for SMS
        uniqueId=uniqueId.replace(/^\+/, '');
        const otpResponse = await axios.post(process.env.SEND_OTP_ENDPOINT, {
          "template_id": process.env.TEMPLATE_ID,
          "mobile": uniqueId,
          "authkey": process.env.AUTH_KEY
        }, {
          httpsAgent: agent // Pass the httpsAgent in the config object
      });
  

        // Check if the OTP sending API response is successful
        if (otpResponse.status === 200) {
          return true;
        } else {
          return false;
        }
      } else {

            // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    const otpExpier = new Date();
    otpExpier.setSeconds(otpExpier.getSeconds() + 120);

    // Create or Update the user record in the database with the generated OTP and its expiration time


 

    const otpRow=await db.Otp.findOne({ where: { email: uniqueId ,type: newUser ? "new_user" : "existing_user" }});

     if(otpRow){
      otpRow.otp=otp;
      otpRow.otpExpireTime=otpExpier;
      await otpRow.save();

     }else{
      await db.Otp.create({otp,otpExpireTime:otpExpier,type: newUser ? "new_user" : "existing_user",email:uniqueId});
     }

    

    const orgDetails=await db.Suborganisation.findByPk(orgId);
    console.log(orgDetails)
        // Create a Nodemailer transporter
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: orgDetails?.email, // Your Gmail email address
            pass: orgDetails?.password // Your Gmail password
          }
        });
  
        // Configure email options
        const mailOptions = {
          from:  orgDetails?.email, // Sender's email address
          to: uniqueId, // Recipient's email address
          subject: 'SeTU User Registration OTP for verification', // Email subject
          text: `Your OTP (It will expire after  2min ): ${otp}` // Email body
        };
  
        // Send email
        await transporter.sendMail(mailOptions);
  
        return true;
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      return false;
    }
  };
  
  // API endpoint to send OTP
  router.post('/sendOTP', async (req, res) => {
    const { uniqueId,newUser,orgId } = req.body;
  
    try {
  if(!newUser){
      const isUserExsit= await getUserDetails(uniqueId,orgId);
      if(!orgId || orgId && !await db.Suborganisation.findByPk(orgId)){
        return res.status(400).json({type:'error', message: 'Suborgnisation not found!' });
      }
      // Check if user exists
      if (!isUserExsit) {
        return res.status(404).json({type:'error', message: 'No user found with given phone number or email!' });
      }
      if(isUserExsit.isActive==0){
        return res.status(401).json({type:'error', message: 'You have been blocked by the organisation!' });
      }
    
   }else{

    const isUserExsit= await getUserDetails(uniqueId,orgId);
    if(!orgId || orgId && !await db.Suborganisation.findByPk(orgId)){
      return res.status(400).json({type:'error', message: 'Suborgnisation not found!' });
    }
    // Check if user exists
    if (isUserExsit) {
      return res.status(404).json({type:'error', message: 'User found with given phone number or email!' });
    }

   }
      // Send OTP
      const otpSent = await sendOtp(uniqueId,orgId,newUser);
     
  
      if (otpSent) {
        res.json({ type:'success', message: 'OTP sent successfully' });
      } else {
        res.status(500).json({ type:'error', message: 'Failed to send OTP' });
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      res.status(500).json({ type:'error', message: 'Internal server error' });
    }
  });
  



// Function to verify OTP
const verifyOtp = async (uniqueId, otp,newUser=false) => {
  try {
    // Check if the unique ID is a phone number
    const isPhoneNumber =  /^(\+).*$/.test(uniqueId);
  
    // Verify OTP via SMS if it's a phone number, otherwise verify via email
    if (isPhoneNumber) {
      uniqueId=uniqueId.replace(/^\+/, '');
      // Make an HTTP POST request to the OTP verification API for SMS
      const otpVerificationResponse = await axios.get(process.env.VERIFY_OTP_ENDPOINT+`otp=${otp}&mobile=${uniqueId}&authkey=${process.env.AUTH_KEY}`
      ,{
        httpsAgent: agent // Pass the httpsAgent in the config object
    });

      return otpVerificationResponse.data.type=='success'; // Return true if OTP verification is successful
    } else {
      // Find the user in the database by email
    
      const otpRow = await db.Otp.findOne({ where: { email: uniqueId,type:newUser?"new_user":"existing_user" }, order: [['createdAt', 'DESC']] });
      console.log('otp', otpRow.otp ,otp, new Date(otpRow.otpExpireTime)> new Date(),otpRow && otpRow.otp == otp && new Date(otpRow.otpExpireTime) > new Date())

      // Check if the user exists and the OTP matches
      return otpRow && otpRow.otp == otp && new Date(otpRow.otpExpireTime) > new Date();
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false; // Return false if an error occurs during OTP verification
  }
};


// API endpoint to verify OTP
router.post('/verifyOTP', async (req, res) => {
  const { uniqueId, otp,suborgId } = req.body;

  try {
    // Verify OTP


    const isUserExsit= await getUserDetails(uniqueId,suborgId);
    if(!suborgId || suborgId && !await db.Suborganisation.findByPk(suborgId)){
      return res.status(400).json({type:'error', message: 'Suborgnisation not found!' });
    }
    // Check if user exists
    if (!isUserExsit ) {
      return res.status(404).json({type:'error', message: 'User not found!' });
    }
    if(isUserExsit.isActive==0){
      return res.status(401).json({type:'error', message: 'You have been blocked by the organisation!' });
    }
    const isOtpVerified = await verifyOtp(uniqueId, otp,false);
    if(isOtpVerified){
      const otpExpier = new Date();
      otpExpier.setMinutes(otpExpier.getMinutes() + 5);
       // Update the user record in the database with the generated OTP and its expiration time
       const isPhoneNumber = /^\d+$/.test(uniqueId);
       if(isPhoneNumber){
        const otpRow=await db.Otp.findOne({ where: { phone: uniqueId ,type: "existing_user" }});

        if(otpRow){
         otpRow.otp=otp;
         otpRow.otpExpireTime=otpExpier;
         await otpRow.save();
   
        }else{
         await db.Otp.create({otp,otpExpireTime:otpExpier,type:"existing_user",phone:uniqueId});
        }
       }
     else{
      const otpRow=await db.Otp.findOne({ where: { email: uniqueId ,type: "existing_user" }});

      if(otpRow){
       otpRow.otp=otp;
       otpRow.otpExpireTime=otpExpier;
       await otpRow.save();
 
      }else{
       await db.Otp.create({otp,otpExpireTime:otpExpier,type:"existing_user", email:uniqueId});
      }
     }
     res.json({type:'success',message:"Otp verified successfully!", verified: isOtpVerified,uniqueId });

    }else{
      res.status(401).json({type:'error',message:"Invalid otp!", verified: isOtpVerified,uniqueId });
    }
    // Send the verification result as response

   
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


const getUserDetails = async (uniqueId,suborgId) => {
  try {
    const user = await db.User.findOne({
      where: {
        [Op.or]: [
          { email: uniqueId },
          { phone: uniqueId }
        ],
        SuborganisationId:suborgId
      },
      include: [{
        model: db.Suborganisation,
        required: false, // Specify it as false for left join
        as: 'Suborganisation' // Assuming the alias for the Suborganization association is 'Suborganization'
      }]
    });

    if (user ) {
      // If user found, return user details
      return user;
    } else {
      // If user not found, return null or throw an error
      return null; // or throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error retrieving user details:', error);
    throw error;
  }
};



router.post('/uploadBulkUsers', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  let users = [];

  const readXlsxFile = async (buffer) => {
    const workbook = new excel.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet(1); // Assuming you want to read the first worksheet
    const rows = [];

  let headerRow = [];
  worksheet.eachRow((row, rowNumber) => {
    const rowData = {};
    row.eachCell((cell, colNumber) => {
      const value = cell.value;
      if (rowNumber === 1) {
        // If it's the first row, store the values as header keys
        headerRow.push(value);
      } else {
        // Otherwise, store the values with corresponding header keys
        const key = headerRow[colNumber - 1]; // Adjusting for 0-based index
        rowData[key] = value;
      }
    });

    // If it's not the first row, push the data object into the rows array
    if (rowNumber !== 1) {
      rows.push(rowData);
    }
  });

  return rows;
  };

  const readCsvFile = (filePath) => {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          resolve(results);
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  };

  try {
    // if (req.file.mimetype === 'text/csv') {
    //   users = await readCsvFile();
    // } else {
    //   users = readXlsxFile();
    // }
    if(
    req.file.mimetype.includes("excel") ||
    req.file.mimetype.includes("spreadsheetml")){
      users = await readXlsxFile(req.file.buffer);
    }
    if(!Array.isArray(users) ||Array.isArray(users) && users.length==0){
      return res.status(400).send(`No valid user data!`);
    }
 
    // Validate and filter users
    const usernames = new Set();
    const emails = new Map();
    const phones = new Map();
    const suborgIds = new Set();
    for (let user of users) {
    

      if (!user.username || !user.name || !user.password || !user.city || !user.SuborganisationId ) {
        return res.status(400).send('Missing fileds.');
      }
      if( !user.email && !user.phone){
        return res.status(400).send('Missing fileds.');
      }
      if(user.phone){
         user.phone="+"+user.phone;
      }

      if (!user.SuborganisationId) {
        return res.status(400).send('Missing SuborganisationId for some users.');
      }

      // Check if SuborganisationId exists
      const suborgExists = await db.Suborganisation.findByPk(user.SuborganisationId);
      if (!suborgExists) {
        return res.status(400).send(`SuborganisationId ${user.SuborganisationId} does not exist.`);
      }

      suborgIds.add(user.SuborganisationId);

      if (usernames.has(user.username)) {
        return res.status(400).send(`Duplicate username ${user.username} found in the uploaded file.`);
      }

      usernames.add(user.username);

      if (!emails.has(user.SuborganisationId)) {
        emails.set(user.SuborganisationId, new Set());
      
      }

      if(!phones.has(user.SuborganisationId)){
        phones.set(user.SuborganisationId, new Set());
      }

      if (user.email && emails.get(user.SuborganisationId).has(user.email)) {
        return res.status(400).send(`Duplicate email ${user.email} found in the uploaded file for SuborganisationId ${user.SuborganisationId}.`);
      }

      if (user.phone && phones.get(user.SuborganisationId).has(user.phone)) {
        return res.status(400).send(`Duplicate phone ${user.phone} found in the uploaded file for SuborganisationId ${user.SuborganisationId}.`);
      }

      emails.get(user.SuborganisationId).add(user.email);
      phones.get(user.SuborganisationId).add(user.phone);

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      console.log("password",user)
      const hashedPassword = await bcrypt.hash(user.password, salt);
      user.password = hashedPassword
    }

    // Check for duplicate usernames in the database
    const existingUsers = await db.User.findAll({ where:{
      username: {[Op.in]: Array.from(usernames) },
    }});

    if (existingUsers.length > 0) {
      return res.status(400).send(`Duplicate username found in the database.`);
    }


    // Check for duplicate emails and phones within the same SuborganisationId in the database
    for (let [SuborganisationId, email] of emails.entries()) {
      const existingUsers = await db.User.findAll({where:{
        SuborganisationId: SuborganisationId,
        email: { [Op.in]:Array.from(email) }
      }});

      if (existingUsers.length > 0) {
        return res.status(400).send(`Duplicate email found in the database for SuborganisationId ${SuborganisationId}.`);
      }
    }

    for (let [SuborganisationId, phone] of phones.entries()) {
      const existingUsers = await db.User.findAll({where:{
        SuborganisationId: SuborganisationId,
        phone: { [Op.in]:Array.from(phone) }
      }});

      if (existingUsers.length > 0) {
        return res.status(400).send(`Duplicate phone found in the database for suborgId ${SuborganisationId}.`);
      }
    }

    // Create users
    await  db.User.bulkCreate(users);
    res.status(200).send('Users uploaded successfully.');

  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error.');
  } finally {
    // Clean up the uploaded file
    // fs.access(filePath, fs.constants.F_OK, (err) => {
    //   if (!err) {
    //     fs.unlink(filePath, (err) => {
    //       if (err) console.error('Error deleting the file:', err);
    //     });
    //   } else {
    //     console.error('File does not exist:', filePath);
    //   }
    // });
  }
});

module.exports = router;
