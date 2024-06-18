const jwt = require('jsonwebtoken');
const db = require('../config/config');

exports.accountActivation = async (req, res) => {
    const { token } = req.params;

    if (token) {
        try {
            const validToken = jwt.verify(token, 'secret');
            if (validToken !== null) {
                const email = validToken.email;

                // Raw SQL query to find a user by email
                const [findUserResult] = await db.promise().execute(
                    'SELECT * FROM users WHERE email = ?',
                    [email]
                );

                if (!findUserResult.length) {
                    res.json({
                        message: 'Your validation is expired. Try to sign up again.',
                        status: 400,
                        success: true
                    });
                } else {
                    // Raw SQL query to update user's isactive column
                    await db.promise().execute(
                        'UPDATE users SET isactive = true WHERE email = ?',
                        [email]
                    );

                    res.json({
                        message: 'Your account is active now. Login.',
                        status: 200,
                        success: true
                    });
                }

            } else {
                res.json({
                    message: 'Empty token',
                    status: 401,
                    success: false
                });
            }
        } catch (error) {
            res.json({
                message: 'Invalid token',
                status: 401,
                success: false
            });
        }
    }
};
