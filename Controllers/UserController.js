const db = require('../config/config');
const bcrypt = require('bcrypt');
const saltRound = 10;
const jwt = require('jsonwebtoken')
var { main, resetPassword } = require('../Componenets/MailComponent')
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
    host: 'mail.mhuv-news.com', // Your SMTP server hostname
    port: 465, // Port for secure SMTP
    secure: true, // true for SSL, false for other ports like 587 or 25
    auth: {
        user: 'assistini@mhuv-news.com', // Your email address
        pass: '+iv]nQG?T}KP' // Your email password
    }
  });


exports.allUsers = async (req, res) => {
    try {
        const [users] = await db.promise().execute(
            'SELECT id,nom,prenom,birthday,email,phone,codePostal, sexe,SSNum FROM users'
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
    const { nom, prenom, birthday, email, password, phone, codePostal, sexe, SSNum, location } = req.body;
    const logoFile = req.files ? req.files.logo : sexe == 'male' ? 'homme.jpeg' : 'femme.jpeg';
    if (nom && prenom && birthday && email && password && phone && sexe) {
        // Check if email or phone number already exists in the "users" table
        const [existingUserByEmail] = await db.promise().execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        const [existingUserByPhone] = await db.promise().execute(
            'SELECT * FROM users WHERE phone = ?',
            [phone]
        );

        // Check if email or phone number already exists in the "users" table
        const [existinguserByEmail] = await db.promise().execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        const [existinguserByPhone] = await db.promise().execute(
            'SELECT * FROM users WHERE phone = ?',
            [phone]
        );

        if (existingUserByEmail.length > 0 || existinguserByEmail.length > 0) {
            return res.status(400).json({
                message: "Email already exists",
                success: false,
                status: 400
            });
        }

        if (existingUserByPhone.length > 0 || existinguserByPhone.length > 0) {
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

                    const info = await transporter.sendMail({
                          from: '"Assistini" <assistini@mhuv-news.com>', // sender address
                          to: email, // list of receivers
                          subject: "Account Activation", // Subject line
                          html: `<p>Your confirmation code is:</p><h1>${confirmationCode}</h1>`, // html body
                      });
                

                    const [newUser] = await db.promise().execute(
                        'INSERT INTO users (nom, prenom, birthday, email, password, phone, codePostal, sexe, SSNum, otp_code, location, logo) VALUES (? , ? ,?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [nom, prenom, birthday, email, hash, phone, codePostal, sexe, SSNum, confirmationCode, location, logoFile]
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
                            token: token,
                            info: {
                                id: user[0].id,
                                fullname: user[0].nom + ' ' + user[0].prenom,
                                email: user[0].email,
                                logo: user[0].logo
                            },
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
                'SELECT id,nom, prenom,birthday,email,phone,codePostal, sexe,SSNum FROM users WHERE id = ?',
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
                const { nom, prenom, birthday, phone, codePostal, sexe, SSNum } = req.body;

                if (nom && prenom && birthday && phone && sexe) {
                    await db.promise().execute(
                        'UPDATE users SET nom= ?, prenom = ?, birthday = ?, phone = ?, codePostal = ?, sexe = ?, SSNum = ? WHERE id = ?',
                        [nom, prenom, birthday, phone, codePostal, sexe, SSNum, id]
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
        'SELECT id,nom, prenom,birthday,email,phone,codePostal, sexe,SSNum, address FROM users WHERE id = ?',
        [Currentuser.id]
    );
    res.json({
        success: true,
        user: user
    })
  } catch (error) {
    
  }
}

exports.blockUser = async (req,res) =>{
    const { id } = req.params;
    if (id) {
        try {
            const [user] = await db.promise().execute(
                'SELECT * FROM users WHERE id = ?',
                [id]
            );

            if (user.length === 0) {
                res.status(400).json({
                    message: "This user doesn't exist",
                    success: false,
                    status: 400
                });
            } else {
                await db.promise().execute(
                    'UPDATE users SET status= "blocked" WHERE id = ?',
                    [id]
                );
                res.json({
                    message: "user blocked  ",
                    success: true,
                    status: 200,
                });
            }
        } catch (error) {
            
            res.json({
                message: 'Error retrieving user',
                success: false,
                status: 500
            });
        }
    }
}


exports.activateuser = async (req,res) =>{
    const { id } = req.params;
    if (id) {
        try {
            const [user] = await db.promise().execute(
                'SELECT * FROM users WHERE id = ?',
                [id]
            );

            if (user.length === 0) {
                res.status(400).json({
                    message: "This user doesn't exist",
                    success: false,
                    status: 400
                });
            } else {
                await db.promise().execute(
                    'UPDATE users SET status= "actif" WHERE id = ?',
                    [id]
                );
                res.json({
                    message: "user activated  ",
                    success: true,
                    status: 200,
                });
            }
        } catch (error) {
            
            res.json({
                message: 'Error retrieving user',
                success: false,
                status: 500
            });
        }
    }
}


exports.toggleFavorite = async (req, res) => {
    const user_id = req.user.id;
    const { provider_id } = req.body;
  
    // Check if provider exists
    const providerQuery = `SELECT * FROM providers WHERE id = ?`;
  
    db.query(providerQuery, [provider_id], (err, providerResults) => {
      if (err) return res.status(500).json({ error: 'Server error' });
  
      if (providerResults.length === 0) {
        return res.status(404).json({ error: 'Provider not found' });
      }
  
      // Check if provider is already in the user's favorites
      const checkFavoritesQuery = `
        SELECT * FROM favorite_providers WHERE userId = ? AND providerId = ?
      `;
  
      db.query(checkFavoritesQuery, [user_id, provider_id], (err, favResults) => {
        if (err) return res.status(500).json({ error: 'Server error' });
  
        if (favResults.length > 0) {
          // Provider is already in favorites, so remove it (toggle off)
          const deleteQuery = `
            DELETE FROM favorite_providers WHERE userId = ? AND providerId = ?
          `;
  
          db.query(deleteQuery, [user_id, provider_id], (err, results) => {
            if (err) return res.status(500).json({ error: 'Server error' });
  
            return res.status(200).json({ message: 'Provider removed from favorites' });
          });
        } else {
          // Provider is not in favorites, so add it (toggle on)
          const insertQuery = `
            INSERT INTO favorite_providers (userId, providerId) 
            VALUES (?, ?)
          `;
  
          db.query(insertQuery, [user_id, provider_id], (err, results) => {
            if (err) return res.status(500).json({ error: 'Server error' });
  
            res.status(200).json({ message: 'Provider added to favorites' });
          });
        }
      });
    });
  };
  exports.listFavorites = async (req, res) => {
    const user_id = req.user.id;
  
    const query = `
      SELECT p.id, p.fullName, p.email, p.cabinName
      FROM providers p
      JOIN favorite_providers f ON p.id = f.providerId
      WHERE f.userId = ?
    `;
  
    db.query(query, [user_id], (err, results) => {
      if (err) return res.status(500).json({ error: 'Server error' });
  
  
      res.json({data:results});
    });
  };
  

  exports.getUserPartners = async (req, res) => {
    const {userId} = req.params; // Assuming req.user contains the logged-in user's information

    try {
        // Query to get partner information for the given user ID
        const [partners] = await db.promise().execute(
            `SELECT 
                p.id AS partnerId, 
                p.name AS partnerName, 
                p.percentage AS partnerPercentage 
             FROM 
                partnerclients pc
             JOIN 
                partners p ON pc.partnerId = p.id
             WHERE 
                pc.userId = ?`,
            [userId]
        );

        // If no partners found, return an empty array
        if (partners.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                message: 'No partners found for this user',
                status: 200
            });
        }

        // Return the list of partners
        res.json({
            success: true,
            data: partners,
            status: 200
        });

    } catch (error) {
        console.error(error);
        res.json({
            success: false,
            errors: error,
            status: 500
        });
    }
};
