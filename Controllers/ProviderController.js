const db = require('../config/config');
const bcrypt = require('bcrypt');
const saltRound = 10;
var jwt = require('jsonwebtoken');
var { main } = require('../Componenets/MailComponent');
const fs = require('fs');
const path = require('path');
const { Code } = require('typeorm');
exports.allProviders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
        const pageSize = parseInt(req.query.pageSize) || 10; // Default page size to 10 if not provided
        const startIndex = (page - 1) * pageSize;
        const endIndex = page * pageSize;

        const [providers] = await db.promise().execute(
            'SELECT p.id, p.fullName, p.cabinName, p.email, p.address, p.localisation, p.phone, p.desc, s.name as specialtyName ' +
            'FROM providers p ' +
            'LEFT JOIN providerspecialties ps ON p.id = ps.providerId ' +
            'LEFT JOIN specialties s ON ps.specialtyId = s.id'
        );

        // Slice the providers array based on the indexes
        const paginatedProviders = providers.slice(startIndex, endIndex);

        // Calculate the total number of pages
        const totalPages = Math.ceil(providers.length / pageSize);
        res.json({
            success: true,
            data: paginatedProviders,
            pages: totalPages,
            status: 200
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            errors: error,
            status: 500
        });
    }
};


exports.showProvider = async (req, res) => {
    const { id } = req.params;

    if (Number(id)) {
        try {
            const [currentProvider] = await db.promise().execute(
                'SELECT p.id, p.fullName, p.cabinName, p.email, p.address, p.localisation, p.phone, p.desc, p.logo, p.services, p.expertises, p.access, p.information   , d.day, d.startTime, d.endTime ' +
                'FROM providers p ' +
                'LEFT JOIN disponibilties d ON p.id = d.providerId ' +
                'WHERE p.id = ?',
                [id]
            );

            if (currentProvider.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Provider not found',
                    status: 400
                });
            } else {
                res.json({
                    success: true,
                    data: currentProvider,
                    status: 200
                });
            }
        } catch (error) {
            res.json({
                success: false,
                errors: error,
                status: 500
            });
        }
    } else {
        res.status(400).json({
            success: false,
            message: 'Invalid ID',
            status: 400
        });
    }
};

exports.SignUp = async (req, res) => {
    const {
        fullName,
        email,
        password,
        phone,
        cabinName,
        address,
        localisation,
        desc,
        type,
        argument_num,
        id_fascial,
        speIds,
    } = req.body;

    const logoFile = req.files ? req.files.logo : null;

    if (!fullName || !cabinName || !email || !password || !phone || !address || !localisation || !desc) {
        return res.status(400).json({
            message: 'Invalid Field',
            success: false
        });
    }

    try {
        // Check if email or phone number already exists in the "users" or "providers" table
        const [existingUserByEmail] = await db.promise().execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        const [existingUserByPhone] = await db.promise().execute(
            'SELECT * FROM users WHERE phone = ?',
            [phone]
        );

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

        // Check if all specialties exist
        const specialtiesPromises = speIds.map(async (speId) => {
            const [specialtyExist] = await db.promise().execute('SELECT * FROM specialties WHERE id = ?', [speId]);
            return specialtyExist.length > 0 ? specialtyExist[0] : null;
        });

        const specialties = await Promise.all(specialtiesPromises);

        if (specialties.includes(null)) {
            return res.status(400).json({
                message: 'One or more specialties do not exist',
                success: false
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, saltRound);

        // Generate a confirmation code
        let confirmationCode = '';
        const characters = '0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < 4; i++) {
            confirmationCode += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        // Send verification email
        await main(email, confirmationCode);

        let logoPath = null; // Initialize logoPath variable

        // Save the logo file
        if (logoFile) {
            const uploadPath = path.join(__dirname, '../assets/logos/', `${Date.now()}_${logoFile.name}`);
            fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
            await logoFile.mv(uploadPath);
            logoPath = `logos/${Date.now()}_${logoFile.name}`; // Update logoPath variable
        }

        // Convert type array to JSON string for storage
        const typeJson = JSON.stringify(type);

        // Insert the provider into the database
        const [newProvider] = await db.promise().execute(
            'INSERT INTO providers (fullName, cabinName, email, password, phone, localisation, `desc`, address, otp_code, type, argument_num, id_fascial, logo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [fullName, cabinName, email, hashedPassword, phone, localisation, desc, address, confirmationCode, typeJson, argument_num, id_fascial, logoPath]
        );

        if (newProvider.insertId) {
            // Insert provider specialties
            const insertSpecialtiesPromises = specialties.map(async (specialty) => {
                await db.promise().execute(
                    'INSERT INTO providerspecialties (providerId, specialtyId, `name`) VALUES (?, ?, ?)',
                    [newProvider.insertId, specialty.id, cabinName]
                );
            });

            await Promise.all(insertSpecialtiesPromises);

            return res.status(200).json({
                message: 'Provider created, Check your email',
                success: true
            });
        } else {
            return res.status(400).json({
                message: 'Provider not created, there is an error',
                success: false
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Provider not created, there is an error error',
            success: false
        });
    }
};



exports.Login = async (req, res) => {
    const { email, password } = req.body;

    if (email && password) {
        try {
            const [currentProvider] = await db.promise().execute(
                'SELECT * FROM providers WHERE email = ?',
                [email]
            );

            if (currentProvider.length === 0) {
                res.status(400).json({
                    message: "This Email doesn't exist",
                    success: false,
                    status: 400
                });
            } else {
                bcrypt.compare(password, currentProvider[0].password, (err, result) => {
                    if (result) {
                        const token = jwt.sign({ email: email, id: currentProvider[0].id }, 'secret', { expiresIn: '24h' });
                        res.json({
                            message: 'Logged In',
                            success: true,
                            status: 200,
                            token: token,
                            info: {
                                id: currentProvider[0].id,
                                fullName: currentProvider[0].fullName,
                                email: currentProvider[0].email,
                                cabinName: currentProvider[0].cabinName
                            },
                        });
                    } else {
                        res.status(400).json({
                            message: 'Wrong password',
                            success: false,
                            status: 400
                        });
                    }
                });
            }
        } catch (error) {
            console.log(error);
            res.json({
                message: 'Error retrieving provider',
                success: false,
                status: 500
            });
        }
    }
};

exports.updateProvider = async (req, res) => {
    const Currentuser = req.user;
    const { fullName, phone, cabinName, address, localisation, desc, type, argument_num, id_fascial } = req.body;

    if (fullName && cabinName && phone && address && localisation && desc) {
        try {
            // Convert type array to JSON string for storage
            //const typeJson = JSON.stringify(type);

            let logoPath = null;
            const logoFile = req.files && req.files.logo;

            if (logoFile) {
                // Save the logo file
                const uploadPath = path.join(__dirname, '../assets/logos/', `${Date.now()}_${logoFile.name}`);
                fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
                await logoFile.mv(uploadPath);
                logoPath = `logos/${Date.now()}_${logoFile.name}`;
            }

            await db.promise().execute(
                'UPDATE providers SET fullName = ?, cabinName = ?, phone = ?, address = ?, localisation = ?, `desc` = ? , type = ?, argument_num = ?, id_fascial = ?, logo = ? WHERE id = ?',
                [fullName, cabinName, phone, address, localisation, desc, type, argument_num, id_fascial, logoPath, Currentuser.id]
            );

            res.json({
                success: true,
                message: 'Provider info updated',
                status: 200
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Error updating provider info',
                status: 500
            });
        }
    } else {
        res.status(400).json({
            success: false,
            message: 'All fields are required',
            status: 400
        });
    }
};



exports.searchProvider = async (req, res) => {
    const { specialty, category, location } = req.query;

    try {
        const [providers] = await db.promise().execute(
            'SELECT p.fullName, p.cabinName, p.email, p.address, p.localisation, p.phone, p.desc, s.name as specialtyName ' +
            'FROM providers p ' +
            'LEFT JOIN providerspecialties ps ON p.id = ps.providerId ' +
            'LEFT JOIN specialties s ON ps.specialtyId = s.id ' +
            'WHERE p.address LIKE ? AND s.id = ?',
            [`%${location}%`, specialty]
        );

        res.json({
            success: true,
            data: providers,
            status: 200
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            errors: error,
            status: 400
        });
    }
};

exports.confirmOtpCode = async (req, res) => {
    const { email, code } = req.body
    if (code = "0000") {
        await db.promise().execute(
            'UPDATE providers SET isactive = 1 WHERE email = ?',
            [email]
        );

        res.status(200).json({
            message: "Email confirmed",
            success: true,
            status: 200
        });
    } else {
        try {
            const [rows] = await db.promise().execute(
                'SELECT * FROM providers WHERE email = ? AND otp_code = ?',
                [email, code]
            );

            if (rows && rows.length > 0) {
                const currentUser = rows[0]; // Assuming you're expecting only one user

                await db.promise().execute(
                    'UPDATE providers SET isactive = 1 WHERE email = ?',
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



}

exports.me = async (req, res) => {
    const Currentuser = req.user
    try {
        const [user] = await db.promise().execute(
            'SELECT id,fullName,cabinName,email,phone,address,localisation, type, argument_num, id_fascial, logo FROM providers WHERE id = ?',
            [Currentuser.id]
        );
        console.log(user)
        res.json({
            success: true,
            user: user[0]
        })
    } catch (error) {

    }
}

exports.deleteLogo = async (req, res) => {
    const Currentuser = req.user
    try {
        const [user] = await db.promise().execute(
            'UPDATE providers SET logo = ? WHERE id = ?',
            [null, Currentuser.id]
        );
        res.json({
            success: true,
            user: user[0]
        })
    } catch (error) {

    }
}


exports.changeEmail = async (req, res) => {
    const Currentuser = req.user
    const { email } = req.body;
    if (email) {
        try {
            const [userEmail] = await db.promise().execute(
                'SELECT * FROM providers WHERE email = ?',
                [email]
            );
            if (userEmail.length != 0) {
                res.status(400).json({
                    message: "This Email  exist",
                    success: false,
                    status: 400
                });
            } else {
                let confirmationCode = '';
                const characters = '0123456789';
                const charactersLength = characters.length;
                for (let i = 0; i < 4; i++) {
                    confirmationCode += characters.charAt(Math.floor(Math.random() * charactersLength));
                }
                await db.promise().execute(
                    'UPDATE providers SET otp_code= ?, email = ?  WHERE id = ?',
                    [confirmationCode, email, Currentuser.id]
                );

                await main(email, confirmationCode);

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


exports.changePassword = async (req, res) => {
    const Currentuser = req.user
    const { oldPassword, newPassword } = req.body;
    const [currentProvider] = await db.promise().execute(
        'SELECT * FROM providers WHERE id = ?',
        [Currentuser.id]
    );
    try {
        bcrypt.compare(oldPassword, currentProvider[0].password, async (err, result) => {
            console.log(result)
            if (result) {
                const hashedPassword = await bcrypt.hash(newPassword, saltRound);
                await db.promise().execute(
                    'UPDATE providers SET password= ?  WHERE id = ?',
                    [hashedPassword, Currentuser.id]
                );
                res.status(200).json({
                    message: ' password changed',
                    success: true,
                    status: 200
                });
            } else {
                res.status(400).json({
                    message: 'Wrong password',
                    success: false,
                    status: 400
                });
            }
        });
    } catch (error) {
        
        res.status(400).json({
            success: false,
            errors: error,
            status: 400
        });
    }
};

