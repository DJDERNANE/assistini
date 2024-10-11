const db = require('../config/config');
const SuperAdminMidleware = async (req, res, next) => {
    const user = req.user;
     if (!user) {
        return res.status(403).json({ message: ' no user' });
    }
    try {
        const [admin] = await db.promise().execute(
            'SELECT * FROM super_admins WHERE username = ? AND id = ? ',
            [user.username, user.id]
        );
        if (admin.length === 0) {
            res.status(200).json({
                message: "midleware error",
                success: false,
                status: 200
            });
        } else {
            next();
        }
        
    } catch (error) {
        return res.json({ message: 'Invalid token' });
    } 
}

module.exports = SuperAdminMidleware ;