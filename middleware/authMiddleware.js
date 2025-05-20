const jwt = require('jsonwebtoken');
//const Orphanage = require('../models/orphanageModel'); // Create a model to fetch orphanages from DB

require('dotenv').config();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification error:', err); 

      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ message: 'Token expired. Please log in again.' });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(403).json({ message: 'Invalid token. Please log in again.' });
      }
      return res.status(403).json({ message: 'Could not authenticate token.' });
    }

    req.user = user; 
    next();
  });
};


const authorizeRole = (requiredRole) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== requiredRole) {
      return res.status(403).json({ message: 'Access denied. ' + requiredRole + 's only.' });
    }
    next();
  };
};


// Middleware to verify if the user is an orphanage and is verified
/*const verifyOrphanage = (req, res, next) => {
  const email = req.params.email;

  Orphanage.getByEmail(email, (err, orphanage) => {
    if (err) return res.status(500).json({ message: 'Error checking orphanage.' });
    if (!orphanage) {
      return res.status(403).json({ message: 'Only orphanages can create campaigns.' });
    }
    if (!orphanage.verified) {
      return res.status(403).json({ message: 'Orphanage must be verified to create campaigns.' });
    }

    req.orphanage = orphanage; // optional: pass orphanage info forward
    next();
  });
};
*/



module.exports = {
  authenticateToken,
  authorizeRole,
  //verifyOrphanage,
};
