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
        const userId = req.user.admin ? req.user.admin : req.user.id;

        console.log('User ID:', userId);

        // Fetch the appointment records
        const [rows] = await db.promise().execute(
            `SELECT r.id, r.status, r.patientName, r.createdAt, p.cabinName, r.motif, r.mode, r.files_access,
                u.nom, u.prenom AS userName, u.email AS userEmail, u.birthday AS userBirthday, u.sexe, u.phone, u.address, 
                app.id AS appointmentId, app.date AS appointmentDate, app.from AS appointmentFrom, app.to AS appointmentTo,
                GROUP_CONCAT(d.id ORDER BY d.id) AS documentIds, 
                GROUP_CONCAT(d.created_at ORDER BY d.id) AS documentCreatedAts, 
                GROUP_CONCAT(d.name ORDER BY d.id) AS documentNames, 
                GROUP_CONCAT(d.documents ORDER BY d.id) AS documentPaths,
                GROUP_CONCAT(uf.id ORDER BY uf.id) AS userFileIds,
                GROUP_CONCAT(uf.created_at ORDER BY uf.id) AS userFileCreatedAts,
                GROUP_CONCAT(uf.doc_name ORDER BY uf.id) AS userFileNames,
                GROUP_CONCAT(uf.doc_path ORDER BY uf.id) AS userFilePaths
                FROM rdvs r 
                JOIN providers p ON r.providerId = p.id 
                JOIN apointments app ON r.appointmentId = app.id
                JOIN users u ON r.UserId = u.id 
                LEFT JOIN documents d ON r.id = d.rdvId 
                LEFT JOIN user_files uf ON r.files_access = 1 AND u.id = uf.user_id
                WHERE r.providerId = ? AND r.status = ? 
                GROUP BY r.id, r.status, r.patientName, r.createdAt, p.cabinName, u.nom, u.prenom, u.email 
                ORDER BY r.urgency DESC, r.createdAt DESC 
                LIMIT ${pageSize} OFFSET ${offset}`,
            [userId, statusRdv]
        );

        // Fetch the total count of records
        const [countResult] = await db.promise().execute(
            'SELECT COUNT(DISTINCT r.id) AS totalCount ' +
            'FROM rdvs r ' +
            'JOIN providers p ON r.providerId = p.id ' +
            'JOIN users u ON r.UserId = u.id ' +
            'LEFT JOIN documents d ON r.id = d.rdvId ' +
            'LEFT JOIN user_files uf ON r.files_access = 1 AND u.id = uf.user_id ' +
            'WHERE r.providerId = ? AND r.status = ?',
            [userId, statusRdv]
        );

        const totalRecords = countResult[0].totalCount;

        // Process the results to format documents and patient files
        const formattedRdvs = rows.map(rdv => {
            // Documents
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

            // Patient Files (Only if access_files = 1)
            let userFiles = [];
            if (rdv.files_access == 1) {
                const userFileIds = rdv.userFileIds ? rdv.userFileIds.split(',') : [];
                const userFileNames = rdv.userFileNames ? rdv.userFileNames.split(',') : [];
                const userFilePaths = rdv.userFilePaths ? rdv.userFilePaths.split(',') : [];
                const userFileCreatedAts = rdv.userFileCreatedAts ? rdv.userFileCreatedAts.split(',') : [];

                userFiles = userFileIds.map((id, index) => ({
                    id: id,
                    name: userFileNames[index] || '',
                    path: userFilePaths[index] || '',
                    createdAt: userFileCreatedAts[index] || ''
                }));
            }

            // Appointment details
            const appointmentDetails = {
                id: rdv.appointmentId,
                date: rdv.appointmentDate,
                from: rdv.appointmentFrom,
                to: rdv.appointmentTo
            };

            return {
                id: rdv.id,
                status: rdv.status,
                patientName: rdv.patientName,
                createdAt: rdv.createdAt,
                cabinName: rdv.cabinName,
                motif: rdv.motif,
                mode: rdv.mode,
                nom: rdv.nom,
                userName: rdv.userName,
                userEmail: rdv.userEmail,
                userBirthday: rdv.userBirthday,
                sexe: rdv.sexe,
                phone: rdv.phone,
                address: rdv.address,
                accessFiles: rdv.files_access,
                appointmentDetails: appointmentDetails,
                documents: documents,
                patientFiles: userFiles // Includes patient files only if access_files is 1
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
            message: 'Error fetching Rdvs',
            error: error.message,
            status: 500
        });
    }
};


exports.watingList = async (req, res) => {
    const userId = req.user.admin ? req.user.admin : req.user.id;
    console.log('User ID:', userId);
    try {
        const [rows] = await db.promise().execute(
            'SELECT r.id, r.patientName, r.createdAt, r.mode, r.motif, r.date, ' +

            'FROM rdvs r ' +
            'JOIN providers p ON r.providerId = p.id ' +
            'JOIN users u ON r.UserId = u.id ' +
            'LEFT JOIN documents d ON r.id = d.rdvId ' +
            'WHERE r.providerId = ? AND r.status = ? ' +
            'GROUP BY r.id, r.patientName, r.createdAt, r.mode, r.motif, r.date',
            [userId, 'pending']
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
        const userId = req.user.admin ? req.user.admin : req.user.id;
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
            [userId, 'confirmed']
        );

        // Fetch the total count of records
        const [countResult] = await db.promise().execute(
            'SELECT COUNT(DISTINCT r.id) AS totalCount ' +
            'FROM rdvs r ' +
            'JOIN providers p ON r.providerId = p.id ' +
            'JOIN users u ON r.UserId = u.id ' +
            'LEFT JOIN documents d ON r.id = d.rdvId ' +
            'WHERE r.providerId = ? AND r.status = ?',
            [userId, 'confirmed']
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
        const userId = req.user.admin ? req.user.admin : req.user.id;

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
    r.providerId,
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
    a.date, a.from, a.to, s.name, u.nom, u.email, u.phone, f.userId
ORDER BY 
    CASE 
        WHEN r.status = 'pending' THEN 1
        WHEN r.status = 'confirmed' THEN 2
        ELSE 3
    END,
    r.createdAt DESC;

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
    const { patientName, type, specialtyId, motif, from, to, date, sexe, birthday, phone } = req.body;
    const { providerId } = req.params;
    const Currentuser = req.user;
    const UserId = Currentuser.id;

    if (!patientName || !type || !specialtyId || !motif || !date || !from || !to || !UserId || !providerId) {
        return res.status(400).json({
            message: 'All fields are required',
            success: false,
            status: 400
        });
    }

    const connection = await db.promise().getConnection(); // Get transaction connection
    try {
        await connection.beginTransaction(); // Start transaction

        // Verify user and provider existence
        const [[userExist]] = await connection.query('SELECT id FROM users WHERE id = ?', [UserId]);
        if (!userExist) {
            await connection.rollback();
            return res.status(404).json({
                message: 'User not found',
                success: false,
                status: 404
            });
        }

        const [[providerExist]] = await connection.query('SELECT id FROM providers WHERE id = ?', [providerId]);
        if (!providerExist) {
            await connection.rollback();
            return res.status(404).json({
                message: 'Provider not found',
                success: false,
                status: 404
            });
        }

        // Verify availability
        const [[dispo]] = await connection.query(
            'SELECT id FROM disponibilties WHERE provider_id = ? AND date = ? AND status = 1',
            [providerId, date]
        );
        if (!dispo) {
            await connection.rollback();
            return res.status(404).json({
                message: 'Availability not found for the selected date',
                success: false,
                status: 404
            });
        }

        // Create appointment
        const [appointment] = await connection.query(
            'INSERT INTO apointments (dispo_id, date, `from`, `to`) VALUES (?, ?, ?, ?)',
            [dispo.id, date, from, to]
        );

        // Create Rdv
        const [rdv] = await connection.query(
            'INSERT INTO rdvs (patientName, UserId, mode, providerId, specialty_id, motif, date, appointmentId, sexe, birthday, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [patientName, UserId, type, providerId, specialtyId, motif, date, appointment.insertId, sexe, birthday, phone]
        );

        // Handle document uploads
        const documents = req.files?.documents;
        if (documents) {
            const files = Array.isArray(documents) ? documents : [documents];

            for (let file of files) {
                const timestamp = Date.now();
                const fileName = `${timestamp}_${file.name}`;
                const uploadPath = path.join(__dirname, '../assets/docs/', fileName);
                await fs.promises.mkdir(path.dirname(uploadPath), { recursive: true });
                await file.mv(uploadPath);

                await connection.query(
                    'INSERT INTO documents (documents, rdvId, name) VALUES (?, ?, ?)',
                    [`docs/${fileName}`, rdv.insertId, file.name]
                );
            }
        }

        // Create notification
        const [notification] = await connection.query(
            `INSERT INTO provider_notifications (providerId, content) VALUES (?, ?)`,
            [providerId, `You have a new rdv for: ${patientName} from ${from} to ${to} on ${date}`]
        );

        // Send notification using Pusher
        if (notification.insertId) {
            pusher.trigger(`provider-${providerId}-channel`, 'provider-notification', {
                notification: notification.insertId,
                providerId: providerId,
                content: `You have a new rdv for: ${patientName} from ${from} to ${to} on ${date}`
            });
        }

        await connection.commit(); // Commit transaction

        res.status(201).json({
            message: 'Rdv created successfully',
            success: true,
            status: 201
        });

    } catch (error) {
        await connection.rollback(); // Rollback transaction in case of error
        console.error('Error:', error);

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

    } finally {
        connection.release(); // Release connection back to the pool
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
    const userId = req.user.admin ? req.user.admin : req.user.id;
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
        const userId = req.user.admin ? req.user.admin : req.user.id;
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
    const providerId = req.user.admin ? req.user.admin : req.user.id;
    const { nom, prenom, birthday, email, phone, location, sexe, type, specialtyId, motif, from, to, date } = req.body;

    if (!nom || !prenom || !birthday || !email || !phone || !sexe || !type || !specialtyId || !motif) {
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
        const [providerExist] = await db.promise().execute('SELECT * FROM providers WHERE id = ?', [providerId]);
        if (providerExist.length === 0) {
            return res.status(404).json({ message: 'Provider not found', success: false });
        }

        // Check availability
        const [dispo] = await db.promise().execute(
            'SELECT * FROM disponibilties WHERE provider_id = ? AND date = ? AND status = 1',
            [userId, date]
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
            [fullname, userId, type, userId, specialtyId, motif, date, appointment.insertId]
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
            [userId, `New RDV for ${fullname} from ${from} to ${to} on ${date}`]
        );

        if (notification) {
            pusher.trigger(`provider-${userId}-channel`, 'provider-notification', {
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
        const connection = await db.promise().getConnection(); // Get a connection

        // Set the time zone
        await connection.query(`SET time_zone = '+01:00';`);

        // Execute the update query
        const [rdvs] = await connection.execute(
            `UPDATE rdvs 
             SET status = 'closed', note = 'Time over' 
             WHERE date < CURDATE() 
             AND (status = 'pending' OR status = 'confirmed');`
        );

        connection.release(); // Release the connection
    } catch (error) {
        console.error(error);
    }
};


exports.AccessFilesRequest = async (req, res) => {
    const userId = req.user.admin ? req.user.admin : req.user.id;
    const rdvId = req.body.rdvId;
    try {
        const rdvupdate = await db.promise().query(`UPDATE rdvs SET files_access = 2 WHERE id = ? AND providerId = ?`, [rdvId, userId]);
        if (rdvupdate) {
            res.status(200).json({ message: "Request sent successfully", success: true });
        } else {
            res.status(400).json({ message: "Error sending request", success: false });
        }
    } catch (error) {
        console.error(error);
    }
};

exports.allAccessFilesRequest = async (req, res) => {
    const userId = req.user.id;
    const { status } = req.query;
    console.log(status)
    let statusKey;
    switch (status) {
        case "accepted":
            statusKey = 1;
            break;
        case "refused":
            statusKey = 3;
            break;
        case "pending":
            statusKey = 2;
            break;
        default:
            statusKey = 0
    }

    try {
        let query;
        let queryParams;

        if (statusKey === 0) {
            // If statusKey = 0, get all files_access values (1, 2, 3)
            query = `
                SELECT r.*, 
                    p.cabinName, p.id AS providerId, p.fullName AS providerName 
                FROM rdvs r
                JOIN providers p ON r.providerId = p.id
                WHERE (r.files_access IN (1, 2, 3)) AND r.UserId = ?
            `;
            queryParams = [userId];
        } else {
            // Otherwise, filter by the specific statusKey
            query = `
                SELECT r.*, 
                    p.cabinName, p.id AS providerId, p.fullName AS providerName 
                FROM rdvs r
                JOIN providers p ON r.providerId = p.id
                WHERE r.files_access = ? AND r.UserId = ?
            `;
            queryParams = [statusKey, userId];
        }

        const [rdvupdate] = await db.promise().query(query, queryParams);

        if (rdvupdate.length > 0) {
            return res.status(200).json({ requests: rdvupdate, success: true });
        } else {
            return res.status(404).json({ message: "No access requests found", success: false });
        }
    } catch (error) {
        console.error("Database error:", error);
        return res.status(500).json({ message: "Internal server error", success: false, error: error.message });
    }
};




exports.AccepetAccessFilesRequest = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    try {
        const rdvupdate = await db.promise().query(`UPDATE rdvs SET files_access = 1 WHERE id = ? AND UserId = ?`, [id, userId]);
        if (rdvupdate) {
            res.status(200).json({ message: "files shared with doctor", success: true });
        } else {
            res.status(400).json({ message: "Error sending request", success: false });
        }
    } catch (error) {
        console.error(error);
    }
};

exports.RefuseAccessFilesRequest = async (req, res) => {
    const userId = req.user.id;
    const { rdvId } = req.params;

    try {
        const [rdvupdate] = await db.promise().query(
            `UPDATE rdvs SET files_access = 3 WHERE id = ? AND UserId = ?`, 
            [rdvId, userId]
        );

        if (rdvupdate.affectedRows > 0) {
            return res.status(200).json({ message: "Files not shared with doctor", success: true });
        } else {
            return res.status(400).json({ message: "No matching record found or update failed", success: false });
        }
    } catch (error) {
        console.error("Database error:", error);
        return res.status(500).json({ message: "Internal server error", success: false, error: error.message });
    }
};



