const express = require("express");
const cors = require("cors");
require('dotenv').config();
const db = require("./app/models");
const router = require("./app/routes/routes");
const https = require('https');
const http = require('http');
const fs = require('fs');
const app = express();
const socketIo =  require('socket.io');
const { decodeTokenMiddleware } = require("./app/midllewares/authMiddleware");


// dynamic cors
// var whitelist = [
//   process.env.FRONTEND_TEST_URL,
//   process.env.FRONTEND_LOCAL_URL

// ];


// var corsOptionsDelegate = function (req, callback) {
//   console.log('origin:',req.header('Origin'),whitelist)
//   const corsOptions = {
//     methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//     preflightContinue: false,
//     optionsSuccessStatus: 204,
//   };
//   if (whitelist.indexOf(req.header("Origin")) !== -1) {
//     corsOptions["origin"] =true // renable the requested origin in the CORS response
//   } else {
//     corsOptions["origin"]=false // disable CORS for this request
//   }
//   callback(null, corsOptions); // callback expects two parameters: error and options
// };

// app.use(cors(corsOptionsDelegate ));

 app.use(cors( ));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));


db.sequelize.sync({alter: false})
  .then(() => {
    console.log("Synced db.");
  })
  .catch((err) => {
    console.log("Failed to sync db: " + err.message);
  });

// // drop the table if it already exists
// db.sequelize.sync({ force: true }).then(() => {
//   console.log("Drop and re-sync db.");
// });






const options = {
  key: fs.readFileSync('/opt/bitnami/letsencrypt/certificates/m2ost.com.key'),
  cert: fs.readFileSync('/opt/bitnami/letsencrypt/certificates/m2ost.com.crt'),
  
};
// const server = http.createServer(app);
const server = https.createServer(options, app);
// set port, listen for requests
const PORT = process.env.PORT || 9000;

const io = socketIo(server,{
  cors: {
    origin: '*',
  },
  maxHttpBufferSize: 1e6, // Adjust buffer size
  pingTimeout: 60000
});

io.use(decodeTokenMiddleware);




// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to setu game." });
});

app.use('/api',router(io))


server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});