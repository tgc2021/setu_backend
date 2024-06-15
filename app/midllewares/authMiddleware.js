
const jwt = require('jsonwebtoken');
const db = require('../models');
module.exports = {
authenticateJWT: (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authorization token is missing' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    const user = await db.User.findOne({
      where: { id: decoded.id }
    });
    if (!user) {
      return res.status(404).json({type:'error', error: 'User not found' });
    }
    req.user = user;
    next();
  });
},

decodeTokenMiddleware :(socket, next) => {
  const token = socket.handshake.query.token;

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return next(new Error('Authentication error'));
      }
      const user = await db.User.findOne({
        where: { id: decoded.id }
      });
      if (!user) {
        return res.status(404).json({type:'error', error: 'User not found' });
      }
      socket.user = user; // Attach decoded user information to socket
      next();
    });
  } else {
    next(new Error('Authentication error'));
  }
},

// Middleware to check if suborgId exists


checkSuborgExists :async (req, res, next) => {
 
  let { suborgId } =req.body
 if(!suborgId){
  suborgId=req.query.suborgId;
 }
  if(!suborgId){
    return res.status(400).send({ error: 'suborgId cantbe empty!' });
  }
  try{
  const suborg = await db.Suborganisation.findByPk(suborgId);
  if (!suborg) {
    return res.status(404).send({ error: 'SuborgId does not exist.' });
  }
  next();
  }catch(e){
    return res.status(404).send({ error: e });
  }
  


}

}
