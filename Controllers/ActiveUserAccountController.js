var jwt = require('jsonwebtoken');
const { Sequelize, User } = require('../models');

exports.accountActivation = async(req, res) => {
    const { token } = req.params;
    
    if (token) {
        try {
            const validtoken = jwt.verify(token, 'secret');
            if (validtoken !== null) {
                const email = validtoken.email;
                const findUser = await User.findOne({where:{email: email}})
                if (findUser === null) {
                    res.json({
                        message: 'your validation is expired , try to Signup again ',
                        status: 400,
                        success: true
                    });
                }else{
                    await findUser.update({isactive: true})
                    res.json({
                        message: 'Your account is active now. Login.',
                        status: 200,
                        success: true
                    });
                }
                
            }else{
                res.json({
                    message: 'empty token',
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
}