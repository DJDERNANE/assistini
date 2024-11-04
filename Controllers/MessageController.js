
const Pusher = require('pusher');
const db = require('../config/config');

// Pusher setup
const pusher = new Pusher({
  appId: "1880135",
  key: "f9291680c25a934e2574",
  secret: "de97a7744e461157dce0",
  cluster: "eu",
});


exports.messages = async (req, res) => {
  const { recipient_id } = req.params;
  console.log(recipient_id)
  const sender_id = req.user.id
  const query = `
    SELECT * FROM messages 
    WHERE ((senderId = ? AND receiverId = ?)
    OR (senderId = ? AND receiverId = ?))
    ORDER BY created_at ASC
  `;

  db.query(query, [sender_id, recipient_id, recipient_id, sender_id], (err, results) => {
    if (err) throw err;
    res.json(results);
  });
};


exports.sendMessage = (req, res) => {
  const { recipient_id, message } = req.body;
  const sender_id = req.user.id;
  const { role } = req.params; // Assume role is passed in the route parameter

  // Determine if the sender is a provider based on role
  let isProvider;

  if (role === 'provider') {
    isProvider = 1;
  } else if (role === 'user') {
    isProvider = 0;
  } else {
    return res.status(400).json({ error: 'Invalid role' });
  }

  // Insert message into the database
  db.query(
    'INSERT INTO messages (senderId, receiverId, content, isProvider) VALUES (?, ?, ?, ?)',
    [sender_id, recipient_id, message, isProvider],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Server error' });

      // Trigger the Pusher event for real-time message sending
      pusher.trigger('private-chat', 'new-message', {
        sender_id,
        recipient_id,
        message,
      });

      res.status(200).send('Message sent successfully.');
    }
  );
};


// Get all users that the current user has had conversations with (with user details)
exports.getAllMyMessages = async (req, res) => {
  const sender_id = req.user.id;
  const { role } = req.params;

  // Determine the correct table and fields based on the role
  let table, nameFields;

  if (role == 'provider') {
    table = 'providers';
    nameFields = 'u.fullName';
  } else if (role == 'user') {
    table = 'users';
    nameFields = 'u.nom, u.prenom';
  } else {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const query = `
    SELECT u.id, ${nameFields}, u.email, u.logo, m.content, m.created_at, u.location
    FROM ${table} u
    JOIN messages m ON (
      (u.id = m.senderId OR u.id = m.receiverId) 
      AND m.created_at = (
        SELECT MAX(m2.created_at)
        FROM messages m2
        WHERE (m2.senderId = u.id OR m2.receiverId = u.id)
          AND (m2.senderId = ? OR m2.receiverId = ?)
      )
    )
    WHERE (m.senderId = ? OR m.receiverId = ?)
    ORDER BY m.created_at DESC
  `;

  db.query(query, [sender_id, sender_id, sender_id, sender_id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });

    res.json({data:results});
  });
};
