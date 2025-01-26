const jwt = require('jsonwebtoken');
const db = require('../config/config');

exports.addNote = async (req, res) => {
    const { receivers, content, reply, title } = req.body;
    const user = req.user;

    if (!Array.isArray(receivers)) {
        return res.status(400).json({
            success: false,
            status: 400,
            message: 'receiver must be an array'
        });
    }

    const values = receivers.map(rec => [title,user.id, rec, content, reply]);

    // // Create a query for multiple insertions
    const query = 'INSERT INTO notes (title,sender, receiver, content, reply) VALUES ?';

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
            'SELECT notes.created_at, notes.title, notes.content , sub_admins.id, sub_admins.username as recieved FROM notes JOIN sub_admins ON notes.receiver = sub_admins.id WHERE sender = ?',
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
            'SELECT notes.created_at, notes.title, notes.content , sub_admins.id as sender_id, sub_admins.username as sender FROM notes JOIN sub_admins ON notes.sender = sub_admins.id WHERE receiver = ?',
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
    const { page = 1, limit = 10, search = '' } = req.query; // Default values for pagination, optional search

    // Calculate the offset for pagination
    const offset = (page - 1) * limit;

    // Base query for getting notes with pagination
    let getNotesQuery = `
        SELECT 
            sa.username AS sender, 
            rn.username AS receiver, 
            COUNT(*) AS note_count
        FROM 
            team_notes tn
        JOIN 
            sub_admins sa ON tn.sender = sa.id
        JOIN 
            sub_admins rn ON tn.receiver = rn.id
        WHERE 
            tn.admin = ?
    `;

    // Append search condition if a search term is provided
    if (search) {
        getNotesQuery += `
            AND (sa.username LIKE ? OR rn.username LIKE ?)
        `;
    }

    // Complete query by adding grouping and pagination
    getNotesQuery += `
        GROUP BY 
            sa.username, rn.username
        LIMIT ? OFFSET ?
    `;

    // Query to count the total number of notes, including the search filter if provided
    let countQuery = `
        SELECT COUNT(*) as total
        FROM team_notes tn
        JOIN sub_admins sa ON tn.sender = sa.id
        JOIN sub_admins rn ON tn.receiver = rn.id
        WHERE tn.admin = ?
    `;

    if (search) {
        countQuery += ` AND (sa.username LIKE ? OR rn.username LIKE ?)`;
    }

    try {
        // Execute the count query
        const totalResults = await new Promise((resolve, reject) => {
            const countParams = search ? [user.id, `%${search}%`, `%${search}%`] : [user.id];
            db.query(countQuery, countParams, (err, results) => {
                if (err) return reject(err);
                resolve(results[0].total); // Extract total from results
            });
        });

        // Execute the paginated query
        const paginatedResults = await new Promise((resolve, reject) => {
            const notesParams = search
                ? [user.id, `%${search}%`, `%${search}%`, parseInt(limit), parseInt(offset)]
                : [user.id, parseInt(limit), parseInt(offset)];
            db.query(getNotesQuery, notesParams, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        // Send the response with pagination, total count, and data
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
