const db = require('../config/config');
const ProviderMidleware = async (req, res, next) => {
    const user = req.user;
     if (!user) {
        return res.status(403).json({ message: ' no user' });
    }
    try {
        const [Provider] = await db.promise().execute(
            'SELECT * FROM providers WHERE email = ? AND id = ? AND cabinName = ?',
            [user.email, user.id, user.cabinName]
        );
        if (Provider.length === 0) {
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

module.exports = ProviderMidleware ;