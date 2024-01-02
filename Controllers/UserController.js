
const { Sequelize, User } = require('../models');
const bcrypt = require('bcrypt');
const saltRound = 10;
var jwt = require('jsonwebtoken');
var { main,resetPassword } = require('../Componenets/MailComponent')


exports.allUsers = async (req, res) => {
    const users = await User.findAll();
    res.json({
        success: true,
        data: users,
        status: 200
    });
}

exports.SignUp = async (req, res) => {
    const { fullName, birthday, email, password, phone, codePostal, sexe, SSNum  } = req.body;
    if (fullName && birthday && email && password && phone && sexe) {
        bcrypt.hash(password, saltRound, async (err, hash) => {
            if (!err) {
                try {
                    const newUser = await User.create({
                        fullName: fullName,
                        birthday: birthday,
                        email: email,
                        password: hash,
                        phone: phone,
                        codePostal: codePostal,
                        sexe: sexe,
                        SSNum: SSNum
                    });
                    const token = jwt.sign({ email: email }, 'secret', { expiresIn: '24h' });
                    //send mail verification link 

                    main(email, token, 'patient').catch(console.error);
                    res.json({
                        message: "User Created, Check your email ",
                        success: true,
                        status: 200,
                    })
                } catch (error) {
                    res.json({
                        message: "User not created there is an error :  ", error,
                        success: false,
                        status: 400
                    })
                }
            } else {
                res.json({
                    message: "Hashing error : ", err,
                    success: false,
                    status: 400
                })
            }

        })

    } else {
        res.json({
            message: "All field are required ...",
            success: false,
            status: 400
        })
    }
};

exports.Login = async (req, res) => {
    const { email, password } = req.body
    if (email && password) {
        const user = await User.findOne({ where: { email: email } });
        if (user === null) {
            res.json({
                message: "This Email doesn't exist",
                success: false,
                status: 400
            })
        } else {
            bcrypt.compare(password, user.password, (err, result) => {
                if (result) {
                    const token = jwt.sign({ email: email, id: user.id }, 'secret', { expiresIn: '24h' });
                    res.json({
                        message: "loged In ",
                        success: true,
                        status: 200,
                        "token": token
                    })
                } else {
                    res.json({
                        message: "Wrong password  ",
                        success: false,
                        status: 400
                    })
                }
            })
        }
    }
}

exports.showUser = async (req, res) => {
    const { id } = req.params;
    if (Number(id)) {
        const current_user = await User.findByPk(id);
        if (current_user === null) {
            res.json({
                success: false,
                message: 'user not found',
                status: 400
            })

        } else {
            res.json({
                success: true,
                data: current_user,
                status: 200
            })
        }
    } else {
        res.json({
            success: false,
            message: 'invalid id',
            status: 400
        })
    }

}

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    if (Number(id)) {
        const user = await User.findByPk(id);
        if (user) {
            const {fullName, birthday, phone, codePostal, sexe, SSNum } = req.body;
            if (fullName && birthday && phone && sexe) {
                await user.update({
                    fullName: fullName,
                    birthday: birthday,
                    phone: phone,
                    codePostal: codePostal,
                    sexe: sexe,
                    SSNum: SSNum
                })
                res.json({
                    success: true,
                    message: "user info updated",
                    status: 200
                })
            }else{
                res.json({
                    success: false,
                    message: "all fiels is required",
                    status: 400
                })
            }
        }else{
            res.json({
                success: false,
                message: "user not found",
                status: 400
            })
        }

    }else{
        res.json({
            success: false,
            message: "invalid Id ",
            status: 400
        })
    }
}


exports.checkEmail = async (req,res) => {
    const {email} = req.body;
    if (email) {
        try{
            const userEmail = await User.findOne({
                where:{
                    email: email
                }
            })
            if (userEmail === null ) {
                res.json({
                    message: "This Email doesn't exist",
                    success: false,
                    status: 400
                })
            }else{
                const code = Math.floor(1000 + Math.random() * 9000);
                await userEmail.update({
                    resetPass: code
                })
                resetPassword(email, code).catch(console.error);
                res.json({
                    message: "code send , Check your email ",
                    success: true,
                    status: 200,
                })
            }
        }
        catch(error){
            res.json({
                success: false,
                errors: error,
                status: 400
            })
        }
    }
}

exports.confrimEmail = async (req,res) => {
    const {code, email} = req.body;
    if (code) {
        const codeExist = await User.findOne({where: {resetPass: code,email:email}})
        if (codeExist === null) {
            res.json({
                message: "Wrong Code ",
                success: false,
                status: 400
            })
        }else{
            await codeExist.update({
                resetPass: null,
            })
            res.json({
                success: true,
                status: 200
            })
        }
    }
}

exports.ResetPassword=async(req,res) => {
    const {email , password} = req.body;
    if (email && password) {
        const currentUser = await User.findOne({where:{email:email}})
        bcrypt.hash(password, saltRound, async (err, hash) => {
            if (!err) {
                try {
                    await currentUser.update({password: hash})
                    res.json({
                        message: "password updated ",
                        success: true,
                        status: 200,
                    })
                } catch (error) {
                    res.json({
                        message: "User not created there is an error :  ", error,
                        success: false,
                        status: 400
                    })
                }
            } else {
                res.json({
                    message: "Hashing error : ", err,
                    success: false,
                    status: 400
                })
            }

        })
    }else{
        res.json({
            message: "All field are required ...",
            success: false,
            status: 400
        })
    }
}