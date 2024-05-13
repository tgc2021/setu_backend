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
var corsOptions = {
  origin: "https://www.m2ost.com",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
  credentials: true 
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));


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
const PORT = process.env.PORT || 8080;
const io = socketIo(server,{
  cors: {
    origin: '*',
  }
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
