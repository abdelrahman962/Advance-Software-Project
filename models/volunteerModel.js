// volunteerModel.js
const db = require('../config/db');

const addService = (user_id, service_type, description, available_dates, callback) => {
  const query = `
    INSERT INTO volunteer_services (user_id, service_type, description, available_dates) 
    VALUES (?, ?, ?, ?)
  `;
  db.query(query, [user_id, service_type, description, available_dates], (err, result) => {
    if (err) return callback(err);
    callback(null, result);
  });
};

const getMatchesByVolunteer = (volunteer_id, callback) => {
  const query = `
    SELECT vr.*, vm.status, vm.id AS match_id 
    FROM volunteer_matches vm 
    JOIN volunteer_requests vr ON vm.request_id = vr.id 
    WHERE vm.volunteer_id = ?
  `;
  db.query(query, [volunteer_id], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};

const acceptMatch = (match_id, callback) => {
  const query = `
    UPDATE volunteer_matches 
    SET status = "accepted" 
    WHERE id = ?
  `;
  db.query(query, [match_id], (err, result) => {
    if (err) return callback(err);
    callback(null, result);
  });
};

const createMatch = (volunteer_id, request_id, callback) => {
  const query = `
    INSERT INTO volunteer_matches (volunteer_id, request_id, status) 
    VALUES (?, ?, "pending")
  `;
  db.query(query, [volunteer_id, request_id], (err, result) => {
    if (err) return callback(err);
    callback(null, result);
  });
};

module.exports = {
  addService,
  getMatchesByVolunteer,
  acceptMatch,
  createMatch,
};
