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
const { type } = require('os');

const agent = new https.Agent({
    rejectUnauthorized: false
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
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({type:'error', message: 'Username and password are required' });
      }

    try {
      // Find user by username or email
      const user = await db.User.findOne({ where: { username } });
  
      // Check if user exists
      if (!user) {
        return res.status(404).json({type:'error', message: 'User not found' });
      }
  
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
  
      if (!isPasswordValid) {
        return res.status(401).json({type:'error', message: 'Invalid password' });
      }
  
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, phone: user.phone,step:user.step,pendingGame:user.pendingGame },
        process.env.JWT_SECRET,
        { expiresIn: '1d' } // Set expiry to 1 day
      );
  
      // Send JWT token as response
      res.json({type:'success', message: 'Login successful', token ,step:user.step});
    } catch (error) {
      res.status(500).json({type:'error', message: error.message });
    }
  });

// Update a user by ID
router.patch('/update/:id', async (req, res) => {
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
router.get('/getAll', async (req, res) => {
  try {
    const users = await db.User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read a user by ID
router.get('/', async (req, res) => {
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
router.get('/checkUserName/:username', async (req, res) => {
  const { username } = req.params;

  try {
    // Query the database to check if the username exists
    const existingUser = await db.User.findOne({ where: { username } });

    // If the user exists, send true; otherwise, send false
    res.json({ exists: !!existingUser });
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//update password

router.patch('/updatePassword',async (req, res) => {
    const { new_password, confirm_password,uniqueId} = req.body;
    
  
    try {
      // Find the user by ID
      const user = await getUserDetails(uniqueId);
  
      // Check if the user exists
      if (!user) {
        return res.status(404).json({type:'error', message: 'User not found' });
      }
  
  
      // Verify new and confirm passwords
      if (new_password !== confirm_password) {
        return res.status(400).json({type:'error', message: 'New password and confirm password do not match' });
      }


      // Check if the user exists and the OTP matches
      const otp = await db.Otp.findOne({ where: { email: uniqueId } });

      if( otp && otp.otpExpireTime > new Date()){
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
    otpExpier.setMinutes(otpExpier.getMinutes() + 1);

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
          text: `Your OTP (It will expire after 1 min): ${otp}` // Email body
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
      const isUserExsit= await getUserDetails(uniqueId);
      if(!isUserExsit)
      return  res.status(404).json({ type:'error', message: 'No User with given phone number or email!' });
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
      const otpRow = await db.Otp.findOne({ where: { email: uniqueId,type:newUser?"new_user":"existing_user" } });
     console.log(otpRow.otpExpireTime,new Date(),otpRow.otp ,otpRow.otpExpireTime > new Date(),otpRow.otp == otp)
      // Check if the user exists and the OTP matches
      return otpRow && otpRow.otp == otp && otpRow.otpExpireTime > new Date();
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false; // Return false if an error occurs during OTP verification
  }
};


// API endpoint to verify OTP
router.post('/verifyOTP', async (req, res) => {
  const { uniqueId, otp } = req.body;

  try {
    // Verify OTP
    const isOtpVerified = await verifyOtp(uniqueId, otp,false);
    if(isOtpVerified){
      const otpExpier = new Date();
      otpExpier.setMinutes(otpExpier.getMinutes() + 1);
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


    }
    // Send the verification result as response

    res.json({type:'success',message:"Otp verified successfully!", verified: isOtpVerified,uniqueId });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


const getUserDetails = async (uniqueId) => {
  try {
    const user = await db.User.findOne({
      where: {
        [Op.or]: [
          { email: uniqueId },
          { phone: uniqueId }
        ]
      },
      include: [{
        model: db.Suborganisation,
        required: false, // Specify it as false for left join
        as: 'Suborganisation' // Assuming the alias for the Suborganization association is 'Suborganization'
      }]
    });

    if (user) {
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


module.exports = router;
