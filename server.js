const express = require("express");
const cors = require("cors");
require('dotenv').config();
const db = require("./app/models");
const router = require("./app/routes/routes");
const https = require('https');
const fs = require('fs');
const app = express();

var corsOptions = {
  origin: "*"
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));


db.sequelize.sync({force: false})
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

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to setu game." });
});

app.use('/api',router)


const options = {
  key: fs.readFileSync('/opt/bitnami/letsencrypt/certificates/m2ost.com.key'),
  cert: fs.readFileSync('/opt/bitnami/letsencrypt/certificates/m2ost.com.crt'),
  
};
const httpsServer = https.createServer(options, app);
// set port, listen for requests
const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => {
//   console.log(`===>Server is running on port ${PORT}.`);
// });

httpsServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
