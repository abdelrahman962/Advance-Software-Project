//userController
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
require('dotenv').config();
const allowedRoles = ['admin', 'donor', 'volunteer', 'sponsor'];
const donationModel = require('../models/donationModel'); // Add this at the top if not already
const Orphanage = require('../models/orphanageModel');

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { first_name, last_name, email, password, phone_number, role } = req.body;

  if (role && !allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Allowed roles: admin, donor, sponsor, volunteer' });
  }

  userModel.findUserByEmail(email, (err, user) => {
    if (err) {
      console.error('Error finding user:', err);
      return res.status(500).json({ message: 'Server error while checking user.' });
    }

    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const userRole = role || 'volunteer';
    const hashedPassword = bcrypt.hashSync(password, 10);
    const verification_code = Math.floor(100000 + Math.random() * 900000).toString();

    userModel.createUser(
      {
        first_name,
        last_name,
        email,
        password: hashedPassword,
        phone_number,
        role: userRole,
        verification_status: 0, 
        verification_code 
      },
      (err, result) => {
        if (err) {
          console.error('Error creating user:', err);
          return res.status(500).json({ message: 'Error creating user' });
        }

        sendVerificationEmail(email, verification_code);

        res.status(201).json({ message: 'User registered successfully. Please check your email to verify your account.' });
      }
    );
  });
};

const sendVerificationEmail = (email, verification_code) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, 
    auth: {
      user: 'abdelrahmanmasri3@gmail.com', 
      pass: 'rxmfywyxxnbbuyus', 
    },
  });


  const mailOptions = {
    from: 'abdelrahmanmasri3@gmail.com',
    to: email,
    subject: 'Email Verification',
    text: `Your verification code is: ${verification_code}. Please use this code to verify your email address.`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Verification email sent:', info.response);
    }
  });
};

const verifyEmail = (req, res) => {
  const { email, verification_code } = req.body; 

  userModel.verifyUserByCode(email, verification_code, (err, result) => {
    if (err) {
      console.error('Error verifying user:', err);
      return res.status(500).json({ message: 'Server error during verification' });
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    res.status(200).json({ message: 'Email verified successfully!' });
  });
};

const login = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  userModel.findUserByEmail(email, (err, user) => {
    if (err) {
      console.error('Error finding user:', err);
      return res.status(500).json({ message: 'Server error while finding user.' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.verification_status) {
      return res.status(403).json({ message: 'User is not verified.' });
    }

    //const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const token = jwt.sign(
      { id: user.user_id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );
    res.json({ token });
  });
};


const getProfile = (req, res) => {
  const userId = req.user.id;

  userModel.findUserById(userId, (err, user) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ message: 'Server error while fetching user.' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { first_name, last_name, email, phone_number, role } = user;

    // If user is a donor, include their donations
    if (role === 'donor') {
      donationModel.getUserDonations(userId, (donationErr, donations) => {
        if (donationErr) {
          console.error('Error fetching donations:', donationErr);
          return res.status(500).json({ message: 'Error retrieving donation history.' });
        }

        // Clean up donation data based on the donation_for field
        const cleanedDonations = donations.map(donation => {
          if (donation.donation_for === 'orphanage') {
            // If donation is for orphanage, remove campaign-specific fields
            const { campaign_id, campaign_title, ...rest } = donation;
            return rest;
          } else if (donation.donation_for === 'campaign') {
            // If donation is for campaign, remove orphanage-specific fields
            const { orphanage_id, ...rest } = donation;
            return rest;
          }
          return donation; // fallback if future donation types are added
        });

        res.json({
          first_name,
          last_name,
          email,
          phone_number,
          role,
          userId,
          donations: cleanedDonations
        });
      });
    } else {
      // Return basic info for non-donors
      res.json({ first_name, last_name, email, phone_number, role, userId });
    }
  });
};
const updateProfile = (req, res) => {
  const userId = req.user.id; 
  const { first_name, last_name, phone_number } = req.body;

  const updateData = {};
  if (first_name) updateData.first_name = first_name;
  if (last_name) updateData.last_name = last_name;
  if (phone_number) updateData.phone_number = phone_number;


  userModel.updateUser(userId, updateData, (err, result) => {
    if (err) {
      console.error('Error updating user profile:', err);
      return res.status(500).json({ message: 'Error updating profile' });
    }
    res.status(200).json({ message: 'Profile updated successfully' });
  });
};

const retrieveAllUsers = async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching renters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const addReview = (req, res) => {
  const userId = req.user.id;
  const { orphanage_id, rating, comment } = req.body;

  // Validate input
  if (!orphanage_id || !rating || comment === undefined) {
    return res.status(400).json({ message: 'orphanage_id, rating, and comment are required.' });
  }

  // Check if the orphanage exists
  Orphanage.getOrphanageById(orphanage_id, (err, results) => {
    if (err) {
      console.error('Error fetching orphanage by ID:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Orphanage not found' });
    }

    // If orphanage exists, proceed to add the review
    const review = {
      user_id: userId,
      orphanage_id,
      rating,
      comment
    };

    userModel.addReview(review, (err, result) => {
      if (err) {
        console.error('Error adding review:', err);
        return res.status(500).json({ message: 'Error adding review.' });
      }

      res.status(201).json({ message: 'Review added successfully.' });
    });
  });
};




module.exports = {
  register,
  verifyEmail,
  login,
  getProfile,
  updateProfile,
  retrieveAllUsers,
  addReview,
};
