const db = require('../config/config');
exports.getRdvStatistics = async (req, res) => {
    try {
        const providerId = req.user.id;

        // Retrieve total count of rdvs for the provider
        const [totalResult] = await db.promise().execute(
            `SELECT COUNT(*) AS totalRdvs 
             FROM rdvs 
             WHERE providerId = ?`, 
            [providerId]
        );
        const totalRdvs = totalResult[0].totalRdvs || 0;

        // Retrieve count of rdvs grouped by status
        const [statusCounts] = await db.promise().execute(
            `SELECT r.status, COUNT(r.id) AS count 
             FROM rdvs r 
             WHERE r.providerId = ? 
             GROUP BY r.status`, 
            [providerId]
        );

        // Retrieve count of rdvs grouped by type (motif)
        const [typeCounts] = await db.promise().execute(
            `SELECT r.motif, COUNT(r.id) AS count 
             FROM rdvs r 
             WHERE r.providerId = ? 
             GROUP BY r.motif`, 
            [providerId]
        );

        // Generate the last 12 months dynamically
        const now = new Date();
        const months = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const month = date.toISOString().slice(0, 7); // Format YYYY-MM
            months.push({ month, count: 0 });
        }

        // Retrieve count of rdvs grouped by month
        const [monthlyCounts] = await db.promise().execute(
            `SELECT DATE_FORMAT(r.date, '%Y-%m') AS month, COUNT(r.id) AS count 
             FROM rdvs r 
             WHERE r.providerId = ? 
               AND r.date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
             GROUP BY month 
             ORDER BY month ASC`, 
            [providerId]
        );

        // Merge the query result with the generated months list
        const monthStats = months.map(m => {
            const found = monthlyCounts.find(mc => mc.month === m.month);
            return {
                month: m.month,
                count: found ? found.count : 0,
                percentage: found ? ((found.count / totalRdvs) * 100).toFixed(2) + '%' : '0.00%'
            };
        });

        // Format statistics for status
        const statusStats = statusCounts.map(item => ({
            status: item.status,
            count: item.count,
            percentage: ((item.count / totalRdvs) * 100).toFixed(2) + '%'
        }));

        // Format statistics for type (motif)
        const typeStats = typeCounts.map(item => ({
            type: item.motif,
            count: item.count,
            percentage: ((item.count / totalRdvs) * 100).toFixed(2) + '%'
        }));

        // Return the data as a JSON response
        res.json({
            success: true,
            data: {
                totalRdvs,
                statusStats,
                typeStats,
                monthStats
            },
            status: 200
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching Rdv statistics',
            error: error.message,
            status: 500
        });
    }
};


