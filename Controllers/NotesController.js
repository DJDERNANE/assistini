const jwt = require('jsonwebtoken');
const db = require('../config/config');

exports.addNote = async (req, res) => {
    const { receivers, content, reply } = req.body;
    const user = req.user;

    if (!Array.isArray(receivers)) {
        return res.status(400).json({
            success: false,
            status: 400,
            message: 'receiver must be an array'
        });
    }

    const values = receivers.map(rec => [user.id, rec, content, reply]);

    // // Create a query for multiple insertions
    const query = 'INSERT INTO notes (sender, receiver, content, reply) VALUES ?';

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


// exports.addNoteToAdmin = async (req, res) => {
//     const { content, reply } = req.body;
//     const user = req.user;

//     db.query('INSERT INTO notes (sender, receiver, content, reply) VALUES (?,?,?,?)', [user.id, user.admin, content, reply], (err, result) => {
//         if (err) {
//             console.error('Error saving message:', err);
//             return res.status(500).json({
//                 success: false,
//                 status: 500,
//                 message: 'Error saving note'
//             });
//         }
//         res.status(200).json({
//             success: true,
//             status: 200,
//             message: 'notes added'
//         });
//     });

// };

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


exports.addTeamNote = async (req, res) => {
    const { receivers, content, reply } = req.body;
    const user = req.user;

    if (!Array.isArray(receivers)) {
        return res.status(400).json({
            success: false,
            status: 400,
            message: 'receiver must be an array'
        });
    }

    const values = receivers.map(rec => [user.id, rec, content, reply, user.admin]);

    // // Create a query for multiple insertions
    const query = 'INSERT INTO team_notes (sender, receiver, content, reply, admin) VALUES ?';

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


exports.getTeamNotes = async (req, res) => {
    const user = req.user; // Assuming the user object is attached to the request
    const { page = 1, limit = 10 } = req.query; // Default values: page = 1, limit = 10

    // Calculate the offset for pagination
    const offset = (page - 1) * limit;

    // Query to get the notes with pagination
    const getNotesQuery = `
        SELECT sender, receiver, COUNT(*) as note_count
        FROM team_notes
        WHERE admin = ?
        GROUP BY sender, receiver
        LIMIT ? OFFSET ?
    `;

    // Query to count the total number of notes where admin = user.id
    const countQuery = `
        SELECT COUNT(*) as total
        FROM team_notes
        WHERE admin = ?
    `;

    // Perform both queries asynchronously
    try {
        // Query to get the total count of notes
        const totalResults = await new Promise((resolve, reject) => {
            db.query(countQuery, [user.id], (err, results) => {
                if (err) return reject(err);
                resolve(results[0].total); // Extract total from results
            });
        });

        // Query to get the notes with pagination
        const paginatedResults = await new Promise((resolve, reject) => {
            db.query(getNotesQuery, [user.id, parseInt(limit), parseInt(offset)], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        // Send the response with pagination and total count
        res.status(200).json({
            success: true,
            status: 200,
            total: totalResults, // Total number of notes
            page: parseInt(page), // Current page
            limit: parseInt(limit), // Limit per page
            data: paginatedResults // Paginated data
        });

    } catch (err) {
        console.error('Error fetching notes:', err);
        return res.status(500).json({
            success: false,
            status: 500,
            message: 'Error fetching notes'
        });
    }
};
