const db = require('../config/config');

exports.allServices = async (req, res) => {
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

exports.createService = async (req, res) => {
    const { specialtyId, nom, price } = req.body;
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

        // Insert the service
        const query = 'INSERT INTO services (nom, price, providerSpecialtyId) VALUES (?, ?, ?)';
        await db.promise().execute(query, [nom, price, spc.id]);

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
