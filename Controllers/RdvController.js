const db = require('../config/config');
const path = require('path');
const fs = require('fs');

exports.allRdvs = async (req, res) => {
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

exports.watingList = async (req, res) => {
    try {
        // Get pagination parameters from the request, with defaults
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;

        // Fetch the total count of records for pagination purposes
        const [totalRowsResult] = await db.promise().execute(
            'SELECT COUNT(DISTINCT r.id) AS totalCount ' +
            'FROM rdvs r ' +
            'JOIN providers p ON r.providerId = p.id ' +
            'JOIN users u ON r.UserId = u.id ' +
            'LEFT JOIN documents d ON u.id = d.UserId ' +
            'WHERE r.providerId = ? AND r.status = ?',
            [req.user.id, 'confirmed']
        );
        const totalCount = totalRowsResult[0].totalCount;

        // Fetch paginated results
        const [rows] = await db.promise().execute(
            'SELECT r.id, r.status, r.patientName, r.createdAt, p.cabinName, ' +
            'u.fullName AS userName, u.email AS userEmail, u.birthday AS userBirthday, u.sexe, ' +
            'GROUP_CONCAT(d.id ORDER BY d.id) AS documentIds, ' +
            'GROUP_CONCAT(d.documents ORDER BY d.id) AS documentFilePaths ' +
            'FROM rdvs r ' +
            'JOIN providers p ON r.providerId = p.id ' +
            'JOIN users u ON r.UserId = u.id ' +
            'LEFT JOIN documents d ON u.id = d.UserId ' +
            'WHERE r.providerId = ? AND r.status = ? ' +
            'GROUP BY r.id, r.status, r.patientName, r.createdAt, p.cabinName, u.fullName, u.email ' +
            'ORDER BY r.urgency DESC, r.createdAt DESC ' +
            'LIMIT ? OFFSET ?',
            [req.user.id, 'confirmed', pageSize, offset]
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
            // data: formattedRdvs,
            meta: {
                totalRecords,
                currentPage: page,
                pageSize: pageSize,
                totalPages: Math.ceil(totalCount / pageSize),
            },
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
        const pageSize = parseInt(req.query.pageSize) || 6; // Ensure pageSize is an integer
        const offset = (page - 1) * pageSize; // Ensure offset is an integer
        
        // Fetch the appointment records
        const [rows] = await db.promise().execute(
            `SELECT r.id, r.status, r.patientName, r.createdAt, p.cabinName, r.motif,
            u.fullName AS userName, u.email AS userEmail, u.birthday AS userBirthday, u.sexe, u.phone, u.address, 
            GROUP_CONCAT(d.id ORDER BY d.id) AS documentIds, 
            GROUP_CONCAT(d.created_at ORDER BY d.id) AS documentCreatedAts, 
            GROUP_CONCAT(d.name ORDER BY d.id) AS documentNames, 
            GROUP_CONCAT(d.documents ORDER BY d.id) AS documentPaths
            FROM rdvs r 
            JOIN providers p ON r.providerId = p.id 
            JOIN users u ON r.UserId = u.id 
            LEFT JOIN documents d ON r.id = d.rdvId 
            WHERE r.providerId = ? AND r.status = ? 
            GROUP BY r.id, r.status, r.patientName, r.createdAt, p.cabinName, u.fullName, u.email 
            ORDER BY r.urgency DESC, r.createdAt DESC 
            LIMIT ${pageSize} OFFSET ${offset}`, 
            [req.user.id, 'confirmed'] // Pass dynamic limit and offset
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

        // Process the results to format documents correctly
        const formattedRdvs = rows.map(rdv => {
            const documentIds = rdv.documentIds ? rdv.documentIds.split(',') : [];
            const documentNames = rdv.documentNames ? rdv.documentNames.split(',') : [];
            const documentPaths = rdv.documentPaths ? rdv.documentPaths.split(',') : [];
            const documentCreatedAts = rdv.documentCreatedAts ? rdv.documentCreatedAts.split(',') : [];

            const documents = documentIds.map((id, index) => ({
                id: id,
                name: documentNames[index] || '', // Document name
                path: documentPaths[index] || '', // Document file path
                createdAt: documentCreatedAts[index] || '' // Creation timestamp
            }));

            return {
                ...rdv,
                documents: documents
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
                totalPages: Math.ceil(totalRecords / pageSize) // Correct totalPages calculation
            },
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



exports.patientAllRdvs = async (req, res) => {
    try {
        const [rdvs] = await db.promise().execute(
            'SELECT r.id, r.status, r.patientName, r.createdAt, p.cabinName, ' +
            'u.fullName AS userName, u.email AS userEmail , u.phone ' +
            'FROM rdvs r ' +
            'JOIN providers p ON r.providerId = p.id ' +
            'JOIN users u ON r.UserId = u.id ' +
            'WHERE r.UserId = ?',
            [req.user.id]
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
    const { patientName, type, specialtyId, motif } = req.body;
    const {providerId } = req.params;
    const Currentuser = req.user 
    const UserId = Currentuser.id
    if (patientName && type && Number(UserId) && Number(providerId) && specialtyId && motif) {
        try {
            const [userExist] = await db.promise().execute('SELECT * FROM users WHERE id = ?', [UserId]);
            const [providerExist] = await db.promise().execute('SELECT * FROM providers WHERE id = ?', [providerId]);

            if (userExist.length > 0 && providerExist.length > 0) {
                const [result] = await db.promise().execute(
                    'INSERT INTO rdvs (patientName, UserId, mode, providerId, specialty_id, motif) VALUES (?, ?, ?, ?, ?, ?)',
                    [patientName, UserId, type, providerId, specialtyId, motif]
                );

                let Paths = [];
                const documents = req.files && req.files.documents;
                if (documents) {
                    // Check if documents is an array (multiple files) or a single file
                    const files = Array.isArray(documents) ? documents : [documents];
                   
                    for (let file of files) {
                        console.log(file.name)
                        const uploadPath = path.join(__dirname, '../assets/docs/', `${Date.now()}_${file.name}`);
                        fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
                        await file.mv(uploadPath);
                        ImgPath = `docs/${Date.now()}_${file.name}`;
                        
                        await db.promise().execute(
                            'INSERT into  documents ( documents, rdvId, name) values (? ,? ,?)',
                            [ImgPath,  result.insertId, file.name]
                        );
                    }
                }
                res.json({
                    message: 'Rdv created',
                    success: true,
                    status: 200
                });
            } else {
                res.json({
                    success: false,
                    status: 400
                });
            }
        } catch (error) {
            console.error('Error Details:', error);
            res.status(500).json({
                message: 'Error creating Rdv',
                error: error.message, // Providing error message directly can be useful
                success: false,
                status: 500
            });
        }
    } else {
        res.json({
            message: 'All fields are required',
            success: UserId,
            status: 400
        });
    }
};

exports.confirmRdv = async (req, res) => {
    const { id } = req.params;
    const {note} = req.body
    if (Number(id)) {
        try {
            const [myRdv] = await db.promise().execute('SELECT * FROM rdvs WHERE id = ?', [id]);

            if (myRdv.length > 0) {
                await db.promise().execute('UPDATE rdvs SET status = ?, note= ?  WHERE id = ?', ['confirmed', note, id]);

                res.json({
                    message: 'Rdv confirmed',
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
                message: 'Error confirming Rdv',
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

exports.cancelRdv = async (req, res) => {
    const { id } = req.params;
    const {note} = req.body
    if (Number(id)) {
        try {
            const [myRdv] = await db.promise().execute('SELECT * FROM rdvs WHERE id = ?', [id]);

            if (myRdv.length > 0) {
                await db.promise().execute('UPDATE rdvs SET status = ? , note = ? WHERE id = ?', ['canceled', note, id]);

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

exports.pricing = async(req, res) => {
    const {services} = req.body
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




