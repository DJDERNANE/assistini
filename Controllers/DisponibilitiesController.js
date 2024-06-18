const db = require('../config/config');

exports.ProviderDisponibilities = async (req, res) => {
    const { id } = req.params;

    if (Number(id)) {
        try {
            // Raw SQL query to retrieve provider's disponibilities
            const [dispo] = await db.promise().execute(
                'SELECT d.day, d.startTime, d.endTime, p.fullName, p.cabinName ' +
                'FROM disponibilities d ' +
                'JOIN providers p ON d.providerId = p.id ' +
                'WHERE p.id = ?',
                [id]
            );

            res.json({
                success: true,
                data: dispo,
                status: 200
            });
        } catch (error) {
            res.json({
                success: false,
                errors: error,
                status: 500
            });
        }
    } else {
        res.json({
            success: false,
            message: 'Invalid provider ID',
            status: 400
        });
    }
};
