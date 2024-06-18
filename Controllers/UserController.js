const db = require('../config/config');
const bcrypt = require('bcrypt');
const saltRound = 10;
const jwt = require('jsonwebtoken')
var { main, resetPassword } = require('../Componenets/MailComponent')
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: 'mail.delta-innovation.net', // Your SMTP server hostname
  port: 465, // Port for secure SMTP
  secure: true, // true for SSL, false for other ports like 587 or 25
  auth: {
      user: 'test@delta-innovation.net', // Your email address
      pass: 'QQamo}Tig&$w' // Your email password
  }
});

exports.allUsers = async (req, res) => {
    try {
        const [users] = await db.promise().execute(
            'SELECT id,fullName,birthday,email,phone,codePostal, sexe,SSNum FROM users'
        );

        res.json({
            success: true,
            data: users,
            status: 200
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            error: error,
            status: 400,
            message: "Error fetching data"
        });
    }
};

exports.SignUp = async (req, res) => {
    const { fullName, birthday, email, password, phone, codePostal, sexe, SSNum } = req.body;
    if (fullName && birthday && email && password && phone && sexe) {
        // Check if email or phone number already exists in the "users" table
        const [existingUserByEmail] = await db.promise().execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        const [existingUserByPhone] = await db.promise().execute(
            'SELECT * FROM users WHERE phone = ?',
            [phone]
        );

        // Check if email or phone number already exists in the "providers" table
        const [existingProviderByEmail] = await db.promise().execute(
            'SELECT * FROM providers WHERE email = ?',
            [email]
        );

        const [existingProviderByPhone] = await db.promise().execute(
            'SELECT * FROM providers WHERE phone = ?',
            [phone]
        );

        if (existingUserByEmail.length > 0 || existingProviderByEmail.length > 0) {
            return res.status(400).json({
                message: "Email already exists",
                success: false,
                status: 400
            });
        }

        if (existingUserByPhone.length > 0 || existingProviderByPhone.length > 0) {
            return res.status(400).json({
                message: "Phone number already exists",
                success: false,
                status: 400
            });
        }
        bcrypt.hash(password, saltRound, async (err, hash) => {
            if (!err)   {
                try {
                    let confirmationCode = '';
                    const characters = '0123456789'; 
                    const charactersLength = 4;
                    for (let i = 0; i < 4; i++) {
                        confirmationCode += characters.charAt(Math.floor(Math.random() * charactersLength));
                    }

                     // send mail verification link
                    const info = await transporter.sendMail({
                          from: '"Assistini" <test@delta-innovation.net>', // sender address
                          to: email, // list of receivers
                          subject: "Account Activation", // Subject line
                          html: `<p>Your confirmation code is:</p><h1>${confirmationCode}</h1>`, // html body
                      });
                

                    const [newUser] = await db.promise().execute(
                        'INSERT INTO users (fullName, birthday, email, password, phone, codePostal, sexe, SSNum, otp_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [fullName, birthday, email, hash, phone, codePostal, sexe, SSNum, confirmationCode]
                    );


                    res.json({
                        message: "User Created, Check your email ",
                        success: true,
                        status: 200,
                    });
                } catch (error) {
                    console.log(error);
                    res.status(400).json({
                        message: "User not created there is an error :  ", error,
                        success: false,
                        status: 400
                    });
                }
            } else {
                res.status(400).json({
                    message: "Hashing error : ", err,
                    success: false,
                    status: 400
                });
            }
        });
    } else {
        res.status(400).json({
            message: "All fields are required ...",
            success: false,
            status: 400
        });
    }
};

exports.Login = async (req, res) => {
    const { email, password } = req.body;
    if (email && password) {
        try {
            const [user] = await db.promise().execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );

            if (user.length === 0) {
                res.status(400).json({
                    message: "This Email doesn't exist",
                    success: false,
                    status: 400
                });
            } else {
                if(user[0].isactive === 0 ){
                    return res.status(401).json({ success:false, message: 'not active' });
                }
                
                  
                
                bcrypt.compare(password, user[0].password, (err, result) => {
                    if (result) {
                        const token = jwt.sign({ email: email, id: user[0].id }, 'secret', { expiresIn: '24h' });
                        res.json({
                            message: "Logged In",
                            success: true,
                            status: 200,
                            token: token
                        });
                    } else {
                        res.status(400).json({
                            message: "Wrong password  ",
                            success: false,
                            status: 400
                        });
                    }
                });
            }
        } catch (error) {
            console.log(error);
            res.status(400).json({
                message: "Error fetching user",
                success: false,
                status: 400
            });
        }
    }
};

exports.showUser = async (req, res) => {
    const { id } = req.params;
    if (Number(id)) {
        try {
            const [current_user] = await db.promise().execute(
                'SELECT id,fullName,birthday,email,phone,codePostal, sexe,SSNum FROM users WHERE id = ?',
                [id]
            );

            if (current_user.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'user not found',
                    status: 400
                });
            } else {
                res.json({
                    success: true,
                    data: current_user[0],
                    status: 200
                });
            }
        } catch (error) {
            console.log(error);
            res.status(400).json({
                success: false,
                message: 'Error fetching user',
                status: 400
            });
        }
    } else {
        res.status(400).json({
            success: false,
            message: 'Invalid id',
            status: 400
        });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    if (Number(id)) {
        try {
            const [user] = await db.promise().execute(
                'SELECT * FROM users WHERE id = ?',
                [id]
            );

            if (user.length > 0) {
                const { fullName, birthday, phone, codePostal, sexe, SSNum } = req.body;

                if (fullName && birthday && phone && sexe) {
                    await db.promise().execute(
                        'UPDATE users SET fullName = ?, birthday = ?, phone = ?, codePostal = ?, sexe = ?, SSNum = ? WHERE id = ?',
                        [fullName, birthday, phone, codePostal, sexe, SSNum, id]
                    );

                    res.json({
                        success: true,
                        message: "user info updated",
                        status: 200
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        message: "all fields are required",
                        status: 400
                    });
                }
            } else {
                res.status(400).json({
                    success: false,
                    message: "user not found",
                    status: 400
                });
            }
        } catch (error) {
            console.log(error);
            res.status(400).json({
                success: false,
                message: 'Error updating user',
                status: 400
            });
        }
    } else {
        res.status(400).json({
            success: false,
            message: "Invalid Id ",
            status: 400
        });
    }
};

exports.checkEmail = async (req, res) => {
    const { email } = req.body;
    if (email) {
        try {
            const [userEmail] = await db.promise().execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );

            if (userEmail.length === 0) {
                res.status(400).json({
                    message: "This Email doesn't exist",
                    success: false,
                    status: 400
                });
            } else {
                const code = Math.floor(1000 + Math.random() * 9000);

                await db.promise().execute(
                    'UPDATE users SET resetPass = ? WHERE email = ?',
                    [code, email]
                );

                resetPassword(email, code).catch(console.error);

                res.json({
                    message: "code sent, Check your email ",
                    success: true,
                    status: 200,
                });
            }
        } catch (error) {
            console.log(error);
            res.status(400).json({
                success: false,
                errors: error,
                status: 400
            });
        }
    }
};

exports.confirmEmail = async (req, res) => {
    const { code, email } = req.body;
    if (code) {
        try {
            const [codeExist] = await db.promise().execute(
                'SELECT * FROM users WHERE resetPass = ? AND email = ?',
                [code, email]
            );

            if (codeExist.length === 0) {
                res.status(400).json({
                    message: "Wrong Code ",
                    success: false,
                    status: 400
                });
            } else {
                await db.promise().execute(
                    'UPDATE users SET resetPass = NULL WHERE resetPass = ? AND email = ?',
                    [code, email]
                );

                res.json({
                    success: true,
                    status: 200
                });
            }
        } catch (error) {
            console.log(error);
            res.status(400).json({
                success: false,
                errors: error,
                status: 400
            });
        }
    }
};

exports.ResetPassword = async (req, res) => {
    const { email, password } = req.body;
    if (email && password) {
        try {
            const [currentUser] = await db.promise().execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );

            bcrypt.hash(password, saltRound, async (err, hash) => {
                if (!err) {
                    try {
                        await db.promise().execute(
                            'UPDATE users SET password = ? WHERE email = ?',
                            [hash, email]
                        );

                        res.json({
                            message: "password updated ",
                            success: true,
                            status: 200,
                        });
                    } catch (error) {
                        console.log(error);
                        res.status(400).json({
                            message: "User not created there is an error :  ", error,
                            success: false,
                            status: 400
                        });
                    }
                } else {
                    res.status(400).json({
                        message: "Hashing error : ", err,
                        success: false,
                        status: 400
                    });
                }
            });
        } catch (error) {
            console.log(error);
            res.status(400).json({
                success: false,
                errors: error,
                status: 400
            });
        }
    } else {
        res.status(400).json({
            message: "All fields are required ...",
            success: false,
            status: 400
        });
    }
};


exports.confirmOtpCode = async(req, res)=>{
    const {email, code} = req.body
    try {
        const [rows] = await db.promise().execute(
            'SELECT * FROM users WHERE email = ? AND otp_code = ?',
            [email, code]
        );

        if (rows && rows.length > 0) {
            const currentUser = rows[0]; // Assuming you're expecting only one user

            await db.promise().execute(
                'UPDATE users SET isactive = 1 WHERE email = ?',
                [email]
            );

            res.status(200).json({
                message: "Email confirmed",
                success: true,
                status: 200
            });
        } else {
            res.status(400).json({
                message: "Wrong code",
                success: false,
                status: 400
            });
        }
    } catch (error) {
        console.error("Error confirming email:", error);
        res.status(500).json({
            message: "Server error",
            success: false,
            status: 500
        });
    }
    

}


exports.me = async(req, res)=>{
   const Currentuser = req.user 
  try {
    const [user] = await db.promise().execute(
        'SELECT id,fullName,birthday,email,phone,codePostal, sexe,SSNum FROM users WHERE id = ?',
        [Currentuser.id]
    );
    res.json({
        success: true,
        user: user
    })
  } catch (error) {
    
  }
}