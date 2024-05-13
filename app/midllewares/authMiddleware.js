
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
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error('Authentication error'));
      }
      socket.user = decoded; // Attach decoded user information to socket
      next();
    });
  } else {
    next(new Error('Authentication error'));
  }
}

}
