var jwt = require('jsonwebtoken');
const { Sequelize, User } = require('../models');
const isAuth = async (req, res, next) => {
    const token = req.header("token");
    if (token) {
        const TokenValidation = jwt.verify(token, 'secret');
        if (TokenValidation) {
            try {
                const findUser = await User.findOne({ where: { id: TokenValidation.id } });
                if (findUser !== null) {
                    activationStatus = findUser.isactive;
                    if (activationStatus) {
                        req.userId = TokenValidation.id;
                        return next()
                    } else {
                        res.json({
                            message: "You must Active your account first",
                            success: false,
                        })
                    }

                }
            } catch (error) {
                res.json({
                    message: "there is an error ",
                    success: false,
                    errorText: error,
                })
            }

        } else {
            res.json({
                message: "You must login",
                success: false,
            })
        }
    } else {
        res.json({
            message: "No token availble",
            success: false,
        })
    }
}

module.exports = { isAuth };