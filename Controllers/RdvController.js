const db = require('../config/config');
const { pusher } = require('../config/pusher');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken')


exports.allRdvs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const statusRdv = req.query.status || "confirmed";
        const pageSize = parseInt(req.query.pageSize) || 9;
        const offset = (page - 1) * pageSize;

        // Fetch the appointment records
        const [rows] = await db.promise().execute(
            `SELECT COUNT(DISTINCT r.id) AS totalCount, r.id, r.status, r.patientName, r.createdAt, p.cabinName, r.motif,r.mode,
                u.nom, u.prenom AS userName, u.email AS userEmail, u.birthday AS userBirthday, u.sexe, u.phone, u.address, 
                app.id AS appointmentId, app.date AS appointmentDate, app.from AS appointmentFrom, app.to AS appointmentTo,
                GROUP_CONCAT(d.id ORDER BY d.id) AS documentIds, 
                GROUP_CONCAT(d.created_at ORDER BY d.id) AS documentCreatedAts, 
                GROUP_CONCAT(d.name ORDER BY d.id) AS documentNames, 
                GROUP_CONCAT(d.documents ORDER BY d.id) AS documentPaths
                FROM rdvs r 
                JOIN providers p ON r.providerId = p.id 
                JOIN apointments app ON r.appointmentId = app.id
                JOIN users u ON r.UserId = u.id 
                LEFT JOIN documents d ON r.id = d.rdvId 
                WHERE r.providerId = ? AND r.status = ? 
                GROUP BY r.id, r.status, r.patientName, r.createdAt, p.cabinName, u.nom, u.prenom, u.email 
                ORDER BY r.urgency DESC, r.createdAt DESC 
                LIMIT ${pageSize} OFFSET ${offset}`,
            [req.user.id, statusRdv]
        );
        console.log(req.user.id);
        // Fetch the total count of records
        const [countResult] = await db.promise().execute(
            'SELECT COUNT(DISTINCT r.id) AS totalCount ' +
            'FROM rdvs r ' +
            'JOIN providers p ON r.providerId = p.id ' +
            'JOIN users u ON r.UserId = u.id ' +
            'LEFT JOIN documents d ON r.id = d.rdvId ' +
            'WHERE r.providerId = ? AND r.status = ?',
            [req.user.id, statusRdv]
        );

        const totalRecords = countResult[0].totalCount;

        // Process the results to format documents and appointment details correctly
        const formattedRdvs = rows.map(rdv => {
            const documentIds = rdv.documentIds ? rdv.documentIds.split(',') : [];
            const documentNames = rdv.documentNames ? rdv.documentNames.split(',') : [];
            const documentPaths = rdv.documentPaths ? rdv.documentPaths.split(',') : [];
            const documentCreatedAts = rdv.documentCreatedAts ? rdv.documentCreatedAts.split(',') : [];

            const documents = documentIds.map((id, index) => ({
                id: id,
                name: documentNames[index] || '',
                path: documentPaths[index] || '',
                createdAt: documentCreatedAts[index] || ''
            }));

            // Include appointment details in the response
            const appointmentDetails = {
                id: rdv.appointmentId,
                date: rdv.appointmentDate,
                from: rdv.appointmentFrom,
                to: rdv.appointmentTo
            };

            return {
                ...rdv,
                documents: documents,
                appointmentDetails: appointmentDetails
            };
        });

        // Return the response
        res.json({
            success: true,
            data: formattedRdvs,
            meta: {
                totalRecords: totalRecords,
                currentPage: page,
                pageSize: pageSize,
                totalPages: Math.ceil(totalRecords / pageSize)
            },
            status: 200
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching confirmed Rdvs',
            error: error.message,
            status: 500
        });
    }
};

exports.watingList = async (req, res) => {
    try {
        const [rows] = await db.promise().execute(
            'SELECT r.id, r.patientName, r.createdAt, r.mode, r.motif, r.date, ' +
            'GROUP_CONCAT(d.id ORDER BY d.id) AS documentIds, ' +
            'GROUP_CONCAT(d.documents ORDER BY d.id) AS documentFilePaths ' +
            'FROM rdvs r ' +
            'JOIN providers p ON r.providerId = p.id ' +
            'JOIN users u ON r.UserId = u.id ' +
            'LEFT JOIN documents d ON r.id = d.rdvId ' +
            'WHERE r.providerId = ? AND r.status = ? ' +
            'GROUP BY r.id, r.patientName, r.createdAt, r.mode, r.motif, r.date',
            [req.user.id, 'pending']
        );

        // Process the results to format documents correctly
        const formattedRdvs = rows.map(rdv => {
            const documentIds = rdv.documentIds ? rdv.documentIds.split(',') : [];
            const documentFilePaths = rdv.documentFilePaths ? rdv.documentFilePaths.split(',') : [];

            const documents = documentIds.map((id, index) => ({
                id: id,
                path: documentFilePaths[index]
            }));

            return {
                ...rdv,
                documents: documents
            };
        });

        res.json({
            success: true,
            data: formattedRdvs,
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




exports.allConfirmedRdvs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 9;
        const offset = (page - 1) * pageSize;

        // Fetch the appointment records
        const [rows] = await db.promise().execute(
            `SELECT r.id, r.status, r.patientName, r.createdAt, p.cabinName, r.motif,r.mode,
                u.nom, u.prenom AS userName, u.email AS userEmail, u.birthday AS userBirthday, u.sexe, u.phone, u.address, 
                app.id AS appointmentId, app.date AS appointmentDate, app.from AS appointmentFrom, app.to AS appointmentTo,
                GROUP_CONCAT(d.id ORDER BY d.id) AS documentIds, 
                GROUP_CONCAT(d.created_at ORDER BY d.id) AS documentCreatedAts, 
                GROUP_CONCAT(d.name ORDER BY d.id) AS documentNames, 
                GROUP_CONCAT(d.documents ORDER BY d.id) AS documentPaths
                FROM rdvs r 
                JOIN providers p ON r.providerId = p.id 
                JOIN appointments app ON r.appointmentId = app.id
                JOIN users u ON r.UserId = u.id 
                LEFT JOIN documents d ON r.id = d.rdvId 
                WHERE r.providerId = ? AND r.status = ? 
                GROUP BY r.id, r.status, r.patientName, r.createdAt, p.cabinName, u.nom, u.prenom, u.email 
                ORDER BY r.urgency DESC, r.createdAt DESC 
                LIMIT ${pageSize} OFFSET ${offset}`,
            [req.user.id, 'confirmed']
        );

        // Fetch the total count of records
        const [countResult] = await db.promise().execute(
            'SELECT COUNT(DISTINCT r.id) AS totalCount ' +
            'FROM rdvs r ' +
            'JOIN providers p ON r.providerId = p.id ' +
            'JOIN users u ON r.UserId = u.id ' +
            'LEFT JOIN documents d ON r.id = d.rdvId ' +
            'WHERE r.providerId = ? AND r.status = ?',
            [req.user.id, 'confirmed']
        );

        const totalRecords = countResult[0].totalCount;

        // Process the results to format documents and appointment details correctly
        const formattedRdvs = rows.map(rdv => {
            const documentIds = rdv.documentIds ? rdv.documentIds.split(',') : [];
            const documentNames = rdv.documentNames ? rdv.documentNames.split(',') : [];
            const documentPaths = rdv.documentPaths ? rdv.documentPaths.split(',') : [];
            const documentCreatedAts = rdv.documentCreatedAts ? rdv.documentCreatedAts.split(',') : [];

            const documents = documentIds.map((id, index) => ({
                id: id,
                name: documentNames[index] || '',
                path: documentPaths[index] || '',
                createdAt: documentCreatedAts[index] || ''
            }));

            // Include appointment details in the response
            const appointmentDetails = {
                id: rdv.appointmentId,
                date: rdv.appointmentDate,
                from: rdv.appointmentFrom,
                to: rdv.appointmentTo
            };

            return {
                ...rdv,
                documents: documents,
                appointmentDetails: appointmentDetails
            };
        });

        // Return the response
        res.json({
            success: true,
            data: formattedRdvs,
            meta: {
                totalRecords: totalRecords,
                currentPage: page,
                pageSize: pageSize,
                totalPages: Math.ceil(totalRecords / pageSize)
            },
            status: 200
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching confirmed Rdvs',
            error: error.message,
            status: 500
        });
    }
};



exports.patientAllRdvs = async (req, res) => {
    try {
        const userId = req.user.id; // Current user ID

        const [rdvs] = await db.promise().execute(
            `SELECT 
    r.id, 
    r.status, 
    r.patientName, 
    r.createdAt, 
    p.cabinName, 
    r.motif,
    r.mode, 
    a.date, 
    a.from, 
    a.to,
    s.name AS specialtyName,
    u.nom AS userName, 
    u.email AS userEmail, 
    u.phone,
    COUNT(d.id) AS documents,
    CASE 
        WHEN f.userId IS NOT NULL THEN TRUE
        ELSE FALSE
    END AS isFavorite
FROM 
    rdvs r 
JOIN 
    providers p ON r.providerId = p.id 
JOIN 
    users u ON r.UserId = u.id 
LEFT JOIN 
    favorite_providers f ON f.providerId = r.providerId AND f.userId = ? 
JOIN 
    apointments a ON r.appointmentId = a.id
JOIN 
    specialties s ON r.specialty_id = s.id
LEFT JOIN 
    documents d ON r.id = d.rdvId
WHERE 
    r.UserId = ?
GROUP BY 
    r.id, r.status, r.patientName, r.createdAt, p.cabinName, r.motif, r.mode, 
    a.date, a.from, a.to, s.name, u.nom, u.email, u.phone, f.userId;
`,
            [userId, userId] // Using the same userId to check if the provider is a favorite and to fetch the user's appointments
        );

        res.json({
            success: true,
            data: rdvs,
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


exports.CreateRdv = async (req, res) => {
    const { patientName, type, specialtyId, motif, from, to, date } = req.body;
    const { providerId } = req.params;
    const Currentuser = req.user;
    const UserId = Currentuser.id;

    if (!patientName || !type || !Number(UserId) || !Number(providerId) || !specialtyId || !motif) {
        return res.status(400).json({
            message: 'All fields are required',
            success: false,
            status: 400
        });
    }

    try {
        // Verify user and provider existence
        const [userExist] = await db.promise().execute('SELECT * FROM users WHERE id = ?', [UserId]);
        const [providerExist] = await db.promise().execute('SELECT * FROM providers WHERE id = ?', [providerId]);
        if (userExist.length === 0) {
            return res.status(404).json({
                message: 'User not found',
                success: false,
                status: 404
            });
        }
        if (providerExist.length === 0) {
            return res.status(404).json({
                message: 'Provider not found',
                success: false,
                status: 404
            });
        }

        // Verify availability
        const [dispo] = await db.promise().execute(
            'SELECT * FROM disponibilties WHERE provider_id = ? AND date = ? AND status = 1',
            [providerId, date]
        );
        if (dispo.length === 0) {
            return res.status(404).json({
                message: 'Availability not found for the selected date',
                success: false,
                status: 404
            });
        }

        // Create appointment and Rdv
        const [appointment] = await db.promise().execute(
            'INSERT INTO apointments (dispo_id, date, `from`, `to`) VALUES (?, ?, ?, ?)',
            [dispo[0].id, date, from, to]
        );
        const [result] = await db.promise().execute(
            'INSERT INTO rdvs (patientName, UserId, mode, providerId, specialty_id, motif, date, appointmentId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [patientName, UserId, type, providerId, specialtyId, motif, date, appointment.insertId]
        );

        // Handle document uploads
        let Paths = [];
        const documents = req.files && req.files.documents;
        if (documents) {
            const files = Array.isArray(documents) ? documents : [documents];
            for (let file of files) {
                const uploadPath = path.join(__dirname, '../assets/docs/', `${Date.now()}_${file.name}`);
                fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
                await file.mv(uploadPath);
                const ImgPath = `docs/${Date.now()}_${file.name}`;

                await db.promise().execute(
                    'INSERT INTO documents (documents, rdvId, name) VALUES (?, ?, ?)',
                    [ImgPath, result.insertId, file.name]
                );
            }
        }


        // Create notification
        const [notification] = await db.promise().execute(
            `INSERT INTO provider_notifications (providerId, content) VALUES (?, "you have a new rdv for : ${patientName}  from ${from} to ${to} on ${date}")`,
            [providerId]
        );

        // send notification using pusher
        if (notification) {
            pusher.trigger(`provider-${providerId}-channel`, 'provider-notification', {
                notification: notification.insertId,
                providerId: providerId,
                content: `you have a new rdv for : ${patientName}  from ${from} to ${to} on ${date}`
            });
        }


        res.status(200).json({
            message: 'Rdv created',
            success: true,
            status: 200
        });

    } catch (error) {
        console.error('Error Details:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Duplicate entry, Rdv already exists',
                success: false,
                status: 409
            });
        }

        res.status(500).json({
            message: 'Error creating Rdv',
            error: error.message,
            success: false,
            status: 500
        });
    }
};


exports.confirmRdv = async (req, res) => {
    const { id } = req.params;
    const { note } = req.body;

    if (!Number(id)) {
        return res.status(400).json({
            message: 'Invalid Id',
            success: false,
        });
    }

    try {
        // Fetch the appointment and provider details
        const [[rdv]] = await db.promise().execute('SELECT * FROM rdvs WHERE id = ?', [id]);
        if (!rdv) {
            return res.status(404).json({
                message: 'Rdv not found',
                success: false,
            });
        }

        const [[provider]] = await db.promise().execute('SELECT * FROM providers WHERE id = ?', [rdv.providerId]);
        if (!provider) {
            return res.status(404).json({
                message: 'Provider not found',
                success: false,
            });
        }

        const recipientId = rdv.UserId;
        const messageContent = `Bonjour, vous avez un rdv ${rdv.date}`;

        // Update the RDV status
        await db.promise().execute('UPDATE rdvs SET status = ?, note = ? WHERE id = ?', ['confirmed', note, id]);

        // Insert the message
        const [messageResult] = await db.promise().execute(
            'INSERT INTO messages (senderId, receiverId, content, isProvider) VALUES (?, ?, ?, ?)',
            [id, recipientId, messageContent, 1]
        );

        // Trigger the Pusher event for real-time message sending
        pusher.trigger(`user-${recipientId}-channel`, 'new-message', {
            messageId: messageResult.insertId,
            senderId: id,
            recipientId,
            content: messageContent,
        });

        // Save the notification
        const notificationContent = `Your RDV with ${provider.cabinName} has been confirmed on ${rdv.date} from ${rdv.from} to ${rdv.to}`;
        const [notificationResult] = await db.promise().execute(
            'INSERT INTO user_notifications (userId, content) VALUES (?, ?)',
            [recipientId, notificationContent]
        );

        // Trigger the notification event
        pusher.trigger(`user-${recipientId}-channel`, 'user-notification', {
            notificationId: notificationResult.insertId,
            providerId: id,
            content: notificationContent,
        });

        return res.status(200).json({
            message: 'Rdv confirmed successfully.',
            success: true,
        });
    } catch (error) {
        console.error('Error confirming Rdv:', error);
        return res.status(500).json({
            message: 'Error confirming Rdv',
            success: false,
        });
    }
};


exports.cancelRdv = async (req, res) => {
    const { id } = req.params;
    const { note } = req.body
    if (Number(id)) {
        try {
            const [myRdv] = await db.promise().execute('SELECT * FROM rdvs WHERE id = ?', [id]);
            const [provider] = await db.promise().execute('SELECT * FROM providers WHERE id = ?', [myRdv[0].providerId]);
            if (myRdv.length > 0) {
                await db.promise().execute('UPDATE rdvs SET status = ? , note = ? WHERE id = ?', ['canceled', note, id]);

                // save notification
                const [notification] = await db.query(
                    `INSERT INTO user_notifications (userId, content) VALUES (?, "your rdv with ${provider[0].cabinName}  has been canceled")`,
                    [myRdv[0].UserId],
                    (err, results) => {
                        if (err) return res.status(500).json({ error: 'Server error' });
                        // send notification using pusher
                        pusher.trigger(`user-${myRdv[0].UserId}-channel`, 'user-notification', {
                            notification: notification.insertId,
                            providerId: id,
                            content: `your rdv with ${provider[0].cabinName} has been canceled `,
                        });


                        pusher.trigger(`user-${myRdv[0].providerId}-channel`, 'rdv-update', {
                            providerId: myRdv[0].providerId,
                        });
                    }
                );

                res.json({
                    message: 'Rdv canceled',
                    success: true,
                    status: 200
                });
            } else {
                res.json({
                    message: 'Rdv not found',
                    success: false,
                    status: 400
                });
            }
        } catch (error) {
            console.log(error);
            res.json({
                message: 'Error canceling Rdv',
                success: false,
                status: 500
            });
        }
    } else {
        res.json({
            message: 'Invalid Id',
            success: false,
            status: 400
        });
    }
};

exports.closeRdv = async (req, res) => {
    const { id } = req.params;

    if (Number(id)) {
        try {
            const [myRdv] = await db.promise().execute('SELECT * FROM rdvs WHERE id = ?', [id]);

            if (myRdv.length > 0) {
                await db.promise().execute('UPDATE rdvs SET status = ? WHERE id = ?', ['closed', id]);

                pusher.trigger(`user-${myRdv[0].providerId}-channel`, 'rdv-update', {
                    providerId: myRdv[0].providerId,
                });
                res.json({
                    message: 'Rdv closed',
                    success: true,
                    status: 200
                });
            } else {
                res.json({
                    message: 'Rdv not found',
                    success: false,
                    status: 400
                });
            }
        } catch (error) {
            console.log(error);
            res.json({
                message: 'Error closing Rdv',
                success: false,
                status: 500
            });
        }
    } else {
        res.json({
            message: 'Invalid Id',
            success: false,
            status: 400
        });
    }
};

exports.deleteRdv = async (req, res) => {
    const { id } = req.params;

    if (Number(id)) {
        try {
            const [myRdv] = await db.promise().execute('SELECT * FROM rdvs WHERE id = ?', [id]);

            if (myRdv.length > 0) {
                await db.promise().execute('DELETE FROM rdvs WHERE id = ?', [id]);

                res.json({
                    message: 'Rdv deleted',
                    success: true,
                    status: 200
                });
            } else {
                res.json({
                    message: 'Rdv not found',
                    success: false,
                    status: 400
                });
            }
        } catch (error) {
            console.log(error);

            pusher.trigger(`user-${myRdv[0].providerId}-channel`, 'rdv-update', {
                providerId: myRdv[0].providerId,
            });
            res.json({
                message: 'Error deleting Rdv',
                success: false,
                status: 500
            });
        }
    } else {
        res.json({
            message: 'Invalid Id',
            success: false,
            status: 400
        });
    }
};


exports.reprogramerRdv = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { date, from, to } = req.body;

    if (!Number(id)) {
        return res.status(400).json({
            message: 'Invalid ID format',
            success: false,
            status: 400
        });
    }

    if (!date || !from || !to) {
        return res.status(400).json({
            message: 'Missing required fields: date, from, or to',
            success: false,
            status: 400
        });
    }

    try {
        // Check if the date and provider_id availability exists
        const [dispo] = await db.promise().execute(
            'SELECT id FROM disponibilties WHERE provider_id = ? AND date = ?',
            [userId, date]
        );


        
       
        if (dispo.length === 0) {
            return res.status(404).json({
                message: 'Availability not found for the selected date',
                success: false,
                status: 404
            });
        }

        // Insert new appointment and update rdv
        const [appointment] = await db.promise().execute(
            'INSERT INTO apointments (dispo_id, date, `from`, `to`) VALUES (?, ?, ?, ?)',
            [dispo[0].id, date, from, to]
        );

        await db.promise().execute(
            'UPDATE rdvs SET status = ?, date = ?, appointmentId = ? WHERE id = ?',
            ['confirmed', date, appointment.insertId, id]
        );
        pusher.trigger(`user-${userId}-channel`, 'rdv-update', {
            providerId: userId,
        });
        res.status(200).json({
            message: 'Rdv confirmed',
            success: true,
            status: 200
        });
    } catch (error) {
        console.error("Error reprogramming Rdv:", error);

        res.status(500).json({
            message: 'Internal server error while confirming Rdv',
            success: false,
            status: 500,
            error: error.message
        });
    }
};


exports.pricing = async (req, res) => {
    const { services } = req.body
    const { id } = req.params;
    let total = 0
    services.forEach(service => {
        total += service
    });

    try {
        await db.promise().execute('INSERT into pricing (total, rdv_id) values (? ,?)', [total, id]);

        res.json({
            success: true,
            status: 200
        });

    } catch (error) {
        console.log(error);
        res.json({
            message: 'Error deleting Rdv',
            success: false,
            status: 500
        });
    }

}

exports.checkRdvForToday = async (req, res) => {
    try {
        const userId = req.user.id; // Current user ID
        const currentDate = new Date().toISOString().split('T')[0]; // Get today's date in 'YYYY-MM-DD' format

        // Query to check if there are any appointments (RDVs) scheduled for today
        const [rdvs] = await db.promise().execute(
            `SELECT r.id, r.status, r.patientName, r.createdAt, p.cabinName, 
                    u.nom AS userName, u.email AS userEmail, u.phone,
                    CASE 
                        WHEN f.userId IS NOT NULL THEN TRUE
                        ELSE FALSE
                    END AS isFavorite,
                    a.date AS appointmentDate,
                    a.from AS appointmentFrom,
                    a.to AS appointmentTo,
                    -- Count patients before the current patient (with status 'pending')
                    (SELECT COUNT(*) 
                     FROM rdvs r2 
                     JOIN apointments a2 ON r2.appointmentId = a2.id
                     WHERE r2.providerId = r.providerId
                       AND a2.date = a.date
                       AND a2.from < a.from
                       AND r2.status = 'confirmed') AS patientsBefore
             FROM rdvs r 
             JOIN providers p ON r.providerId = p.id 
             JOIN users u ON r.UserId = u.id 
             LEFT JOIN favorite_providers f ON f.providerId = r.providerId AND f.userId = ? 
             JOIN apointments a ON r.appointmentId = a.id
             WHERE r.UserId = ? AND a.date = ? AND r.status = 'confirmed'`, // Ensure RDV status is 'pending'
            [userId, userId, currentDate] // The current user and today's date
        );

        // Adjust the date to account for timezone differences
        rdvs.forEach(entry => {
            entry.appointmentDate = new Date(new Date(entry.appointmentDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        });

        res.json({
            success: true,
            data: rdvs,
            status: 200
        });
    } catch (error) {
        res.json({
            success: false,
            errors: error.message,
            status: 500
        });
    }
};


exports.SignUpAndCreateRdv = async (req, res) => {
    const user = req.user;
    const { nom, prenom, birthday, email, phone, location, sexe, type, specialtyId, motif, from, to, date } = req.body;

    if (!nom || !prenom || !birthday || !email  || !phone || !sexe  || !type  || !specialtyId || !motif) {
        return res.status(400).json({
            message: "All fields are required",
            success: false
        });
    }

    try {
        // Check if email or phone exists
        const [existingUser] = await db.promise().execute('SELECT * FROM users WHERE email = ? OR phone = ?', [email, phone]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email or phone already exists", success: false });
        }

        const hashedPassword = await bcrypt.hash("12345678", saltRounds);
        let confirmationCode = Math.floor(1000 + Math.random() * 9000).toString();

        // Create user
        const [newUser] = await db.promise().execute(
            'INSERT INTO users (nom, prenom, birthday, email, password, phone, sexe, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [nom, prenom, birthday, email, hashedPassword, phone, sexe, location]
        );

        const userId = newUser.insertId;

        // Verify provider exists
        const [providerExist] = await db.promise().execute('SELECT * FROM providers WHERE id = ?', [user.id]);
        if (providerExist.length === 0) {
            return res.status(404).json({ message: 'Provider not found', success: false });
        }

        // Check availability
        const [dispo] = await db.promise().execute(
            'SELECT * FROM disponibilties WHERE provider_id = ? AND date = ? AND status = 1',
            [user.id, date]
        );
        if (dispo.length === 0) {
            return res.status(404).json({ message: 'No availability for the selected date', success: false });
        }

        // Create appointment
        const [appointment] = await db.promise().execute(
            'INSERT INTO apointments (dispo_id, date, `from`, `to`) VALUES (?, ?, ?, ?)',
            [dispo[0].id, date, from, to]
        );

        // Create RDV
        const fullname = `${user.nom} ${user.prenom}`;
        const [rdv] = await db.promise().execute(
            'INSERT INTO rdvs (patientName, UserId, mode, providerId, specialty_id, motif, date, appointmentId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [fullname, userId, type, user.id, specialtyId, motif, date, appointment.insertId]
        );

        // Handle document uploads
        if (req.files && req.files.documents) {
            const files = Array.isArray(req.files.documents) ? req.files.documents : [req.files.documents];
            for (let file of files) {
                const filePath = `docs/${Date.now()}_${file.name}`;
                const uploadPath = path.join(__dirname, '../assets/', filePath);
                fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
                await file.mv(uploadPath);
                await db.promise().execute('INSERT INTO documents (documents, rdvId, name) VALUES (?, ?, ?)', [filePath, rdv.insertId, file.name]);
            }
        }

        // Send notification
        const [notification] = await db.promise().execute(
            'INSERT INTO provider_notifications (providerId, content) VALUES (?, ?)',
            [user.id, `New RDV for ${fullname} from ${from} to ${to} on ${date}`]
        );

        if (notification) {
            pusher.trigger(`provider-${user.id}-channel`, 'provider-notification', {
                notification: notification.insertId,
                userId: userId,
                content: `New RDV for ${fullname} from ${from} to ${to} on ${date}`
            });
        }

        res.status(200).json({ message: "User created and RDV scheduled", success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error processing request", error: error.message, success: false });
    }
};


exports.RdvTimeOver = async () => {
    try {
        const [rdvs] = await db.promise().execute(
            `UPDATE rdvs r SET status = 'closed', note = 'Time over' WHERE r.date < CURDATE() AND ( r.status = 'pending' OR r.status = 'confirmed')`
        )
    } catch (error) {
        console.error(error);
    }
}

