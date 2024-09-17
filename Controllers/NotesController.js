const jwt = require('jsonwebtoken');
const db = require('../config/config');

exports.addNote = async (req, res) => {
    const { receivers, content } = req.body;
    const user = req.user;

    if (!Array.isArray(receivers)) {
        return res.status(400).json({
            success: false,
            status: 400,
            message: 'receiver must be an array'
        });
    }

    const values = receivers.map(rec => [user.id, rec, content]);

    // // Create a query for multiple insertions
    const query = 'INSERT INTO notes (sender, receiver, content) VALUES ?';

    db.query(query, [values], (err, result) => {
        if (err) {
            console.error('Error saving message:', err);
            return res.status(500).json({
                success: false,
                status: 500,
                message: 'Error saving note'
            });
        }
        res.status(200).json({
            success: true,
            status: 200,
            message: 'notes added'
        });
    });
    return user;

};


exports.addTeamNote = async (req, res) => {
    const { team, content } = req.body;
    const user = req.user;

    try {
        await db.promise().execute(
            'INSERT INTO team_notes (sender, team, content) VALUES (?, ?, ?)', 
            [user.id, team, content]
        );
        res.json({
            message: 'Note created',
            success: true,
            status: 200
        });
    } catch (error) {
        console.log(error);
        res.json({
            message: 'Error creating note',
            success: false,
            status: 500
        });
    }
    
};



exports.getNotesSended = async (req, res) => {
    const user = req.user
    try {
        const [Notes] = await db.promise().execute(
            'SELECT notes.title, notes.content , sub_admins.id, sub_admins.username as recieved FROM notes JOIN sub_admins ON notes.receiver = sub_admins.id WHERE sender = ?',
            [user.id]
        );


        res.json({
            success: true,
            data: Notes,
            status: 200
        });
    } catch (error) {
        res.json({
            success: false,
            errors: error,
            status: 500
        });
    }
};


exports.getNotesRecieved = async (req, res) => {
    const user = req.user
    try {
        const [Notes] = await db.promise().execute(
            'SELECT notes.title, notes.content , sub_admins.id as sender_id, sub_admins.username as sender FROM notes JOIN sub_admins ON notes.sender = sub_admins.id WHERE receiver = ?',
            [user.id]
        );


        res.json({
            success: true,
            data: Notes,
            status: 200
        });
    } catch (error) {
        res.json({
            success: false,
            errors: error,
            status: 500
        });
    }
};

