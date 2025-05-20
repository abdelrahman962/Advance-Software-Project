//donationModel.js

const db = require('../config/db');

exports.insertDonation = (data, callback) => {
  const sql = `
  INSERT INTO donations 
  (user_id, type, amount, orphanage_id, campaign_id, category, donation_for, remaining_balance)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(sql, data, callback);
};


exports.getUserDonations = (userId, callback) => {
  const sql = `
    SELECT d.*, ec.title AS campaign_title
    FROM donations d
    LEFT JOIN emergency_campaigns ec ON d.campaign_id = ec.id
    WHERE d.user_id = ?
    ORDER BY d.created_at DESC`;
  db.query(sql, [userId], callback);
};




exports.getAllDonations = (callback) => {
  const sql = `SELECT d.*, u.first_name, u.last_name FROM donations d 
               JOIN users u ON d.user_id = u.user_id 
               ORDER BY d.created_at DESC`;
  db.query(sql, callback);
};

exports.getDonationTracking = (donationId, callback) => {
  const sql = `SELECT * FROM donation_tracking WHERE donation_id = ?`;
  db.query(sql, [donationId], callback);
};


exports.createCampaign = (data, callback) => {
  const sql = `INSERT INTO emergency_campaigns (title, amount, ended_at,orphanage_id ) VALUES (?, ?, ?,?)`;
  db.query(sql, data, callback);
};

exports.getUserCampaigns = (userId, callback) => {
  const sql = `
  SELECT ec.id, ec.title, ec.amount, o.name AS orphanage_name
FROM emergency_campaigns ec
LEFT JOIN orphanages o ON ec.orphanage_id = o.id
ORDER BY ec.ended_at ASC;
`;

  db.query(sql, [userId], callback);
};

exports.getDonationById=(id,callback)=>{
  const sql=`SELECT * from donations where id=?`;
  db.query(sql,[id],callback);
}



exports.updateCampaignAmount= (campaignId, donatedAmount, callback) => {
  const sql = `UPDATE emergency_campaigns SET amount = amount - ? WHERE id = ?`;
  db.query(sql, [donatedAmount, campaignId], callback);
}


exports.getCampaignById = (campaign_id, callback) => {
  const sql = `
    SELECT 
      ec.id,
      ec.amount AS goal_amount,
      COALESCE(SUM(d.amount), 0) AS amount_raised
    FROM emergency_campaigns ec
    LEFT JOIN donations d
      ON ec.id = d.campaign_id AND d.donation_for = 'emergency_campaign'
    WHERE ec.id = ?
    GROUP BY ec.id, ec.amount
  `;

  db.query(sql, [campaign_id], callback);
};



/*
exports.insertDonationTracking = (data, callback) => {
  const sql = `
    INSERT INTO donation_tracking (donation_id, description, photo_url)
    VALUES (?, ?, ?)`;
  db.query(sql, data, callback);
};
*/