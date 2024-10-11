var jwt = require('jsonwebtoken');
const isAuth = async (req, res, next) => {
    const authHeader = req.header("authorization");
     // Check if bearer is undefined
     if (!authHeader) return res.status(403).send({ auth: false, message: 'No token provided.' });

     // Remove Bearer from string
     const token = authHeader.split(' ')[1];

     if (!token) {
        return res.status(403).json({ message: 'Token not provided' });
    }
    try {
        jwt.verify(token, 'secret', (err, decoded) => {
            if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
            // if everything good, save to request for use in other routes
            req.user = decoded;
            next();
        });
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
    
    
}

module.exports = isAuth ;