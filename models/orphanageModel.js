// models/orphanageModel.js
const db = require('../config/db');

exports.createOrphanage = (name, city, address, contact_email, callback) => {
  const query = `
    INSERT INTO orphanages (name, city, address, contact_email)
    VALUES (?, ?, ?, ?)
  `;
  db.query(query, [name, city, address, contact_email], callback);
};

exports.getOrphanageById = (id, callback) => {
    const query = `SELECT * FROM orphanages WHERE id = ?`;
    db.query(query, [id], callback);
  };
 

  // Create a new service request
  exports.createRequest = (orphanage_id, service_needed, description, needed_date, callback) => {
    const query = `
      INSERT INTO volunteer_requests (orphanage_id, service_needed, description, needed_date)
      VALUES (?, ?, ?, ?)
    `;
    db.query(query, [orphanage_id, service_needed, description, needed_date], callback);
  };
  
  // Automatically match volunteers to a service request
  exports.autoMatchVolunteers = (service_needed, requestId, callback) => {
    const getVolunteersQuery = `
      SELECT user_id FROM volunteer_services WHERE service_type = ?
    `;
  
    db.query(getVolunteersQuery, [service_needed], (err, volunteers) => {
      if (err) {
        return callback(err);
      }
  
      if (volunteers.length === 0) {
        return callback(null, []);
      }
  
      const insertMatchesQuery = `
        INSERT INTO volunteer_matches (volunteer_id, request_id) VALUES ?
      `;
  
      const values = volunteers.map(v => [v.user_id, requestId]);
  
      db.query(insertMatchesQuery, [values], (insertErr) => {
        if (insertErr) {
          return callback(insertErr);
        }
        callback(null, volunteers);
      });
    });
  };
  



 
  exports.getByEmail = (email, callback) => {
    const sql = `SELECT * FROM orphanages WHERE contact_email = ?`;
    db.query(sql, [email], callback);
  };


  exports.getRequestsByOrphanageId = (orphanageId, callback) => {
    const query = `
      SELECT * FROM volunteer_requests 
      WHERE orphanage_id = ?
      ORDER BY needed_date DESC
    `;
    db.query(query, [orphanageId], callback);
  };
  
  exports.getDonationsForOrphanage = (orphanageId, callback) => {
    const query = 'SELECT * FROM donations WHERE orphanage_id = ?';
    db.query(query, [orphanageId], callback);
  };
  

  // 1. Record a new usage entry
  exports.recordDonationUsage = (donationId, usage_description, amount_used, used_date, callback) => {
    // Ensure the donationId is correctly passed to the function
  
    const getDonationQuery = `
      SELECT amount, remaining_balance
      FROM donations
      WHERE id = ?
    `;
  
    db.query(getDonationQuery, [donationId], (err, results) => {
      if (err) {
        return callback(err);
      }
  
      if (results.length === 0) {
        return callback(new Error('Donation not found'));
      }
  
      const { amount, remaining_balance } = results[0];
      const remaining = remaining_balance || amount; // Fallback to full amount if remaining_balance is null
      
      if (amount_used > remaining) {
        return callback(new Error('Insufficient remaining balance'));
      }
  
      const insertUsageQuery = `
        INSERT INTO donation_usage (donation_id, usage_description, amount_used, used_date)
        VALUES (?, ?, ?, ?)
      `;
      
      db.query(insertUsageQuery, [donationId, usage_description, amount_used, used_date], (err2, result) => {
        if (err2) {
          return callback(err2);
        }
  
        const newRemainingBalance = remaining - amount_used;
        const updateDonationQuery = `
          UPDATE donations
          SET remaining_balance = ?
          WHERE id = ?
        `;
        
        db.query(updateDonationQuery, [newRemainingBalance, donationId], (err3) => {
          if (err3) {
            return callback(err3);
          }
  
          callback(null, { message: 'Donation usage recorded successfully', newRemainingBalance });
        });
      });
    });
  };
  

// 2. Get usage history
exports.getDonationUsageByDonationId = (donationId, callback) => {
  const query = `SELECT * FROM donation_usage WHERE donation_id = ? ORDER BY used_date DESC`;
  db.query(query, [donationId], callback);
};

// 3. Get total used + original donation amount
exports.getDonationBalance = (donationId, callback) => {
  const query = `
    SELECT 
      d.amount AS total_donated,
      IFNULL(SUM(u.amount_used), 0) AS total_used
    FROM donations d
    LEFT JOIN donation_usage u ON d.id = u.donation_id
    WHERE d.id = ?
    GROUP BY d.id
  `;
  db.query(query, [donationId], callback);
};

exports.getOrphansByOrphanageId = (orphanageId, callback) => {
  const query = 'SELECT * FROM orphans WHERE orphanage_id = ?';
  
  db.query(query, [orphanageId], callback);
};

exports.getDonationUsageByUsageId = (usageId, callback) => {
  const sql = `SELECT * FROM donation_usage WHERE id = ?`;
  db.query(sql, [usageId], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
};



 /*
  exports.createRequest = (orphanage_id, service_needed, description, needed_date, callback) => {
    const query = `
      INSERT INTO volunteer_requests (orphanage_id, service_needed, description, needed_date)
      VALUES (?, ?, ?, ?)
    `;
    db.query(query, [orphanage_id, service_needed, description, needed_date], callback);
  };
  */

   /*
  
  exports.autoMatchVolunteers = async (service_needed, requestId) => {
    const [volunteers] = await db.query(
      'SELECT user_id FROM volunteer_services WHERE service_type = ?',
      [service_needed]
    );
  
    for (const v of volunteers) {
      await db.query(
        'INSERT INTO volunteer_matches (volunteer_id, request_id) VALUES (?, ?)',
        [v.user_id, requestId]
      );
    }
  
    return volunteers;
  };

*/