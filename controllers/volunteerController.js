//volunteerController.js


// volunteerController.js

const VolunteerModel = require('../models/volunteerModel');

exports.registerService = (req, res) => {
  const { user_id, service_type, description, available_dates } = req.body;
  
  // Using callback with the model function
  VolunteerModel.addService(user_id, service_type, description, available_dates, (err, result) => {
    if (err) {
      console.error('Error registering service:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(201).json({ message: 'Service registered successfully.' });
  });
};

exports.getMatches = (req, res) => {
  const volunteerId = req.params.id;

  // Using callback with the model function
  VolunteerModel.getMatchesByVolunteer(volunteerId, (err, matches) => {
    if (err) {
      console.error('Error fetching matches:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(matches);
  });
};

exports.acceptMatch = (req, res) => {
  const matchId = req.params.matchId;

  // Using callback with the model function
  VolunteerModel.acceptMatch(matchId, (err, result) => {
    if (err) {
      console.error('Error accepting match:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json({ message: 'Match accepted.' });
  });
};

exports.createMatch = (req, res) => {
  const { volunteer_id, request_id } = req.body;

  // Using callback with the model function
  VolunteerModel.createMatch(volunteer_id, request_id, (err, result) => {
    if (err) {
      console.error('Error creating match:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(201).json({ message: 'Match created successfully.' });
  });
};












/*
const VolunteerModel = require('../models/volunteerModel');

exports.registerService = async (req, res) => {
  try {
    const { user_id, service_type, description, available_dates } = req.body;
    await VolunteerModel.addService(user_id, service_type, description, available_dates);
    res.status(201).json({ message: 'Service registered successfully.' });
  } catch (err) {
    console.error('Error registering service:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getMatches = async (req, res) => {
  try {
    const volunteerId = req.params.id;
    const matches = await VolunteerModel.getMatchesByVolunteer(volunteerId);
    res.json(matches);
  } catch (err) {
    console.error('Error fetching matches:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.acceptMatch = async (req, res) => {
  try {
    const matchId = req.params.matchId;
    await VolunteerModel.acceptMatch(matchId);
    res.json({ message: 'Match accepted.' });
  } catch (err) {
    console.error('Error accepting match:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Create a new match between volunteer and a request
exports.createMatch = async (req, res) => {
  try {
    const { volunteer_id, request_id } = req.body;
    await VolunteerModel.createMatch(volunteer_id, request_id);
    res.status(201).json({ message: 'Match created successfully.' });
  } catch (err) {
    console.error('Error creating match:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};*/