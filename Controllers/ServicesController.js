const db = require('../config/config');

exports.specialtyServices = async (req, res) => {
    const user = req.user;
    const { spcId } = req.params;
    try {
        const [Services] = await db.promise().execute(
            `SELECT s.*
            FROM services s
            JOIN providerspecialties ps ON s.providerSpecialtyId = ps.id
            WHERE ps.providerId = ? AND ps.specialtyId = ?`,
        [user.id, spcId]);

        res.json({
            success: true,
            data: Services,
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

exports.allServices = async (req, res) => {
    const user = req.user;
    try {
        const [services] = await db.promise().execute(
            `SELECT s.*
            FROM services s
            JOIN providerspecialties ps ON s.providerSpecialtyId = ps.id
            WHERE ps.providerId = ?`,
            [user.id]
        );

        res.status(200).json({
            success: true,
            data: services,
            status: 200
        });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({
            success: false,
            errors: error,
            status: 500,
            message: 'Error fetching services'
        });
    }
};
exports.createService = async (req, res) => {
    const { specialtyId, nom, price, description } = req.body;
    const user = req.user;
    try {
        // Select the providerSpecialty
        const [rows] = await db.promise().execute(
            'SELECT * FROM providerspecialties WHERE providerId = ? AND specialtyId = ?', 
            [user.id, specialtyId]
        );

        // Check if providerSpecialty exists
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: 'Provider specialty not found'
            });
        }

        const spc = rows[0];

        await db.promise().execute(
            'INSERT INTO services (nom, description, price, providerSpecialtyId) VALUES (?, ?, ? ,?)',
            [nom, description, price, spc.id]
        );

        res.status(200).json({
            success: true,
            status: 200,
            message: 'Service added'
        });
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({
            success: false,
            status: 500,
            message: 'Error creating service',
            errors: error
        });
    }
};

exports.deleteService = async (req, res) => {
    const { id } = req.params;

    if (Number(id)) {
        try {
            const [result] = await db.promise().execute('DELETE FROM services WHERE id = ?', [id]);

            if (result.affectedRows > 0) {
                res.json({
                    message: "Service deleted",
                    success: true,
                    status: 200
                });
            } else {
                res.json({
                    message: "No Service found",
                    success: false,
                    status: 400
                });
            }
        } catch (error) {
            res.json({
                message: "Error deleting Service",
                success: false,
                errors: error,
                status: 500
            });
        }
    } else {
        res.json({
            message: "Invalid id",
            success: false,
            status: 400
        });
    }
};
