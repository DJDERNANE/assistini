const db = require('../config/config');

exports.sendMessage = (socket, {senderId, recipientId, message} ) => {
    //console.log('Message received:', socket.id);
    db.query('INSERT INTO messages (senderId, receiverId, content) VALUES (?, ?, ?)', 
        [senderId, recipientId, message], 
        (err, result) => {
            if (err) {
                console.error('Error saving message:', err);
                return;
            }
            console.log('Message saved to database');
            
        }
    );
    db.query('SELECT * FROM messages ', 
    (err, results) => {
        if (err) {
            console.error('Error loading messages:', err);
            socket.emit('error', 'Failed to load messages');
            return;
        }
        socket.emit('receive_message', results);
    });
    // Broadcast the message to all connected clients
    //socket.broadcast.emit('receive-message', data);
};

exports.loadMessages = (socket, id) => {
    db.query('SELECT * FROM messages WHERE senderId = ? ', [id], 
    (err, results) => {
        if (err) {
            console.error('Error loading messages:', err);
            socket.emit('error', 'Failed to load messages');
            return;
        }
        socket.emit('receive_message', results);
    });
};