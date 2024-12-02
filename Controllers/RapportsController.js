const db = require('../config/config');


exports.create = (req, res) => {
    const { rdvId, result, conclusion } = req.body;

    db.query('INSERT INTO rapports (rdvId, result, conclusion) VALUES (?, ?, ?)', [rdvId, result, conclusion], (err, result) => {
        if (err) {
            console.log(err);
            res.status(400).json({ success: false, status: 400, message: 'Error saving message' });
        }
        res.status(200).json({ success: true, status: 200, message: 'rapport added' });
    });
}

exports.getall = (req, res) => {
    const user = req.user;

    db.query(
        'SELECT * FROM rapports WHERE rdvId IN (SELECT id FROM rdvs WHERE providerId = ?)',
        [user.id],
        (err, result) => {
            if (err) {
                console.error("Database query error:", err);
                return res.status(400).json({
                    success: false,
                    status: 400,
                    message: 'Error fetching rapports',
                });
            }
            return res.status(200).json({
                success: true,
                status: 200,
                rapports: result,
            });
        }
    );
};

exports.getRapportById = (req, res) => {
    const { id } = req.params;

    db.query(`
        SELECT 
            rp.*, 
            rd.createdAt, 
            pro.fullName AS provider_name, 
            pro.email AS provider_email, 
            user.fullName AS user_name, 
            user.email AS user_email
        FROM 
            rapports rp
        JOIN 
            rdvs rd ON rp.rdvId = rd.id
        JOIN 
            providers pro ON rd.providerId = pro.id
        JOIN 
            users user ON rd.userId = user.id
        WHERE 
            rp.id = ?`,
        [id], (err, result) => {
            if (err) {
                console.error("Database query error:", err);
                return res.status(400).json({
                    success: false,
                    status: 400,
                    message: 'Error fetching rapports',
                });
            }
            return res.status(200).json({
                success: true,
                status: 200,
                rapports: result[0],
            });
        });
}
const getRdvId = (id) => {
    return new Promise((resolve, reject) => {
        db.query(
            'SELECT rdv_id FROM invoices WHERE id = ?',
            [id],
            (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            }
        );
    });
};
exports.getRapportByInvoiceId = async (req, res) => {
    try {
        const [rdv] = await getRdvId(req.params.id); // Fetch rdv based on params
        db.query(`
            SELECT 
                rp.*, 
                rd.createdAt, 
                pro.fullName AS provider_name, 
                pro.email AS provider_email, 
                users.nom AS user_name, 
                users.email AS user_email
            FROM 
                rapports rp
            JOIN 
                rdvs rd ON rp.rdvId = rd.id
            JOIN 
                providers pro ON rd.providerId = pro.id
            JOIN 
                users ON rd.userId = users.id
            WHERE 
                rp.rdvId = ?`,
            [rdv.rdv_id],  
            (err, result) => {
                if (err) {
                    console.error("Database query error:", err);
                    return res.status(400).json({
                        success: false,
                        status: 400,
                        message: 'Error fetching rapports',
                    });
                }
                return res.status(200).json({
                    success: true,
                    status: 200,
                    rapports: result[0],  // Assuming you want to return a single rapport
                });
            }
        );
    } catch (err) {
        console.error("Database query error:", err);
        return res.status(400).json({
            success: false,
            status: 400,
            message: 'Error fetching rdv',
        });
    }
    

}