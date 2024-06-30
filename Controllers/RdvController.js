const db = require('../config/config');

exports.allRdvs = async (req, res) => {
    try {
        const [rdvs] = await db.promise().execute(
            'SELECT r.id, r.patientName, r.createdAt, r.mode , r.motif, r.date ' +
            'FROM rdvs r ' +
            'JOIN providers p ON r.providerId = p.id ' +
            'JOIN users u ON r.userId = u.id ' +
            'WHERE r.providerId = ? and r.status = ?',
            [req.user.id, 'pending']
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

exports.watingList = async (req, res) => {
    try {
        const [rdvs] = await db.promise().execute(
            'SELECT r.id, r.status, r.patientName, r.createdAt, p.cabinName, ' +
            'u.fullName AS userName, u.email AS userEmail , u.phone ' +
            'FROM rdvs r ' +
            'JOIN providers p ON r.providerId = p.id ' +
            'JOIN users u ON r.userId = u.id ' +
            'WHERE r.providerId = ? and r.status = ? ' + 
            'ORDER BY  r.urgency DESC,  r.createdAt DESC ',
            [req.user.id, 'confirmed']
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


exports.allConfirmedRdvs = async (req, res) => {
    try {
        const [rdvs] = await db.promise().execute(
            'SELECT r.id, r.status, r.patientName, r.createdAt, p.cabinName, ' +
            'u.fullName AS userName, u.email AS userEmail , u.phone ' +
            'FROM rdvs r ' +
            'JOIN providers p ON r.providerId = p.id ' +
            'JOIN users u ON r.userId = u.id ' +
            'WHERE r.providerId = ? and r.status = ? ',
            [req.user.id, 'confirmed']
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

exports.patientAllRdvs = async (req, res) => {
    try {
        const [rdvs] = await db.promise().execute(
            'SELECT r.id, r.status, r.patientName, r.createdAt, p.cabinName, ' +
            'u.fullName AS userName, u.email AS userEmail , u.phone ' +
            'FROM rdvs r ' +
            'JOIN providers p ON r.providerId = p.id ' +
            'JOIN users u ON r.userId = u.id ' +
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
    const { userId, providerId } = req.params;

    if (patientName && type && Number(userId) && Number(providerId) && specialtyId && motif) {
        try {
            const [userExist] = await db.promise().execute('SELECT * FROM users WHERE id = ?', [userId]);
            const [providerExist] = await db.promise().execute('SELECT * FROM providers WHERE id = ?', [providerId]);

            if (userExist.length > 0 && providerExist.length > 0) {
                await db.promise().execute(
                    'INSERT INTO rdvs (patientName, userId, mode, providerId, specialty_id, motif) VALUES (?, ?, ?, ?, ?, ?)',
                    [patientName, userId, type, providerId, specialtyId, motif]
                );

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
            success: false,
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


