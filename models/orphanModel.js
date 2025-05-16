
//orphanModel.js
const db = require('../config/db'); 

exports.insertOrphan = (data, callback) => {
  const sql = `
    INSERT INTO orphans (name, age, education_status, health_condition, photo_url, orphanage_id)
    VALUES (?, ?, ?, ?, ?, ?)`;

  db.query(sql, data, callback);
};

// Add orphans to donation usage
exports.addOrphanToUsage = (data, callback) => {
  const usageId = data[0];
  const orphanId = data[1];

  // Step 1: Get donation_id from donation_usage
  const getDonationIdSql = `SELECT donation_id FROM donation_usage WHERE id = ?`;
  db.query(getDonationIdSql, [usageId], (err, usageResults) => {
    if (err) return callback(err);
    if (usageResults.length === 0) return callback(new Error("Donation usage not found"));

    const donationId = usageResults[0].donation_id;

    // Step 2: Get orphanage_id from donations using donation_id
    const getDonationOrphanageSql = `SELECT orphanage_id FROM donations WHERE id = ?`;
    db.query(getDonationOrphanageSql, [donationId], (err, donationResults) => {
      if (err) return callback(err);
      if (donationResults.length === 0) return callback(new Error("Donation not found"));

      const donationOrphanageId = donationResults[0].orphanage_id;

      // Step 3: Get orphanage_id of the orphan
      const getOrphanSql = `SELECT orphanage_id FROM orphans WHERE orphan_id = ?`;
      db.query(getOrphanSql, [orphanId], (err, orphanResults) => {
        if (err) return callback(err);
        if (orphanResults.length === 0) return callback(new Error("Orphan not found"));

        const orphanOrphanageId = orphanResults[0].orphanage_id;

        if (donationOrphanageId !== orphanOrphanageId) {
          return callback(new Error("Orphan does not belong to the same orphanage as the donation"));
        }

        // Step 4: Insert into donation_usage_orphans
        const insertSql = `INSERT INTO donation_usage_orphans (usage_id, orphan_id, notes) VALUES (?, ?, ?)`;
        db.query(insertSql, data, callback);
      });
    });
  });
};

// Get all orphans that benefited from a specific donation
exports.getOrphansByDonationUsage = (usageId, callback) => {
  const sql = `
    SELECT o.orphan_id, o.name, o.age, d.notes
    FROM donation_usage_orphans d
    JOIN orphans o ON d.orphan_id = o.orphan_id
    WHERE d.usage_id = ?`;
  db.query(sql, [usageId], callback);
};

exports.getAllOrphansWithSponsor = (callback) => {
  const sql = `
    SELECT o.*, u.first_name, u.last_name, u.email
    FROM orphans o
    LEFT JOIN sponsorships s ON o.orphan_id = s.orphan_id
    LEFT JOIN users u ON s.user_id = u.user_id`;

  db.query(sql, callback);
};

exports.sponsorOrphan = (data, callback) => {
  const sql = `
    INSERT INTO sponsorships (user_id, orphan_id, amount, start_date, end_date)
    VALUES (?, ?, ?, ?, ?)`;

  db.query(sql, data, callback);
};

exports.updateOrphanProfile = (health_condition, education_status, photo_url, orphanId, callback) => {
  const sql = `
    UPDATE orphans 
    SET 
      health_condition = ?, 
      education_status = ?, 
      photo_url = ?
    WHERE orphan_id = ?`;

  db.query(sql, [health_condition, education_status, photo_url, orphanId], callback);
};



exports.getSponsoredOrphans = (orphanageId, callback) => {
  const query = `
    SELECT 
      o.orphan_id, o.name AS orphan_name, o.age, o.education_status, o.health_condition, o.photo_url,
      s.sponsorship_id, s.amount, s.start_date, s.end_date,
      u.email AS sponsor_email
    FROM orphans o
    INNER JOIN sponsorships s ON o.orphan_id = s.orphan_id
    INNER JOIN users u ON s.user_id = u.user_id
    WHERE o.orphanage_id = ?
  `;
  db.query(query, [orphanageId], callback);
};

exports.getUnSponsoredOrphans = (orphanageId, callback) => {
  const query = `
    SELECT 
      o.orphan_id, o.name AS orphan_name, o.age, o.education_status, o.health_condition, o.photo_url
    FROM orphans o
    LEFT JOIN sponsorships s ON o.orphan_id = s.orphan_id
    WHERE o.orphanage_id = ? AND s.orphan_id IS NULL
  `;
  db.query(query, [orphanageId], callback);
};
