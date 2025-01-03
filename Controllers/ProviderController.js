const db = require('../config/config');
const bcrypt = require('bcrypt');
const saltRound = 10;
var jwt = require('jsonwebtoken');
var { main } = require('../Componenets/MailComponent');
const fs = require('fs');
const path = require('path');
exports.allProviders = async (req, res) => {
    const currentUser = req.user;
    try {
        // Get today's date or user-provided date for filtering
        const dateParam = req.query.date;
        const currentDate = dateParam ? new Date(dateParam) : new Date(); // Default to today if no date is provided
        const formattedDate = currentDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const startIndex = (page - 1) * pageSize;

        // Query to retrieve all providers and filter disponibilities for today
        const [providers] = await db.promise().execute(
            `SELECT 
                p.id AS providerId, p.fullName, p.cabinName, p.email, p.address, p.location, 
                p.phone, p.desc, s.name AS specialtyName,
                CASE WHEN f.userId IS NOT NULL THEN true ELSE false END AS isFavorite,
                d.id AS disponibilityId, d.date AS date, d.morning_start_time AS morningStartTime, d.morning_end_time AS morningEndTime, 
                d.evening_start_time AS eveningStartTime, d.evening_end_time AS eveningEndTime, d.patient_interval AS patientInterval,
                a.id AS appointmentId, a.date AS appointmentDate, a.from AS appointmentStart, a.to AS appointmentEnd
             FROM providers p
             LEFT JOIN providerspecialties ps ON p.id = ps.providerId
             LEFT JOIN specialties s ON ps.specialtyId = s.id
             LEFT JOIN favorite_providers f ON p.id = f.providerId AND f.userId = ?
             LEFT JOIN disponibilties d ON d.provider_id = p.id
             LEFT JOIN apointments a ON a.dispo_id = d.id AND a.date = ?  -- Filter appointments for today
             WHERE d.status = 1
             ORDER BY p.id ASC, d.date ASC`,
            [currentUser.id, formattedDate]
        );

        // Process and format data as previously structured
        const providerMap = {};
        providers.forEach((row) => {
            if (!providerMap[row.providerId]) {
                providerMap[row.providerId] = {
                    id: row.providerId,
                    fullName: row.fullName,
                    cabinName: row.cabinName,
                    email: row.email,
                    address: row.address,
                    location: row.location,
                    phone: row.phone,
                    desc: row.desc,
                    specialtyName: row.specialtyName,
                    isFavorite: row.isFavorite,
                    disponibilities: [],
                };
            }

            if (row.disponibilityId) {
                // Create a new disponibility object if it doesn't already exist for this provider
                let disponibility = providerMap[row.providerId].disponibilities.find(d => d.id === row.disponibilityId);
                if (!disponibility) {
                    disponibility = {
                        id: row.disponibilityId,
                        date: row.date,
                        morningStartTime: row.morningStartTime,
                        morningEndTime: row.morningEndTime,
                        eveningStartTime: row.eveningStartTime,
                        eveningEndTime: row.eveningEndTime,
                        patientInterval: row.patientInterval,
                        appointments: [],  // Start with an empty array for appointments
                    };
                    providerMap[row.providerId].disponibilities.push(disponibility);
                }

                // If there is an appointment for this disponibility, add it to the appointments array
                if (row.appointmentId) {
                    disponibility.appointments.push({
                        id: row.appointmentId,
                        date: row.appointmentDate,
                        from: row.appointmentStart,
                        to: row.appointmentEnd,
                    });
                }
            }
        });

        // Get the paginated providers
        const paginatedProviders = Object.values(providerMap).slice(startIndex, startIndex + pageSize);
        const totalPages = Math.ceil(Object.values(providerMap).length / pageSize);

        res.json({
            success: true,
            data: paginatedProviders,
            pages: totalPages,
            status: 200
        });
    } catch (error) {
        console.error('Error in allProviders:', error);
        res.status(500).json({
            success: false,
            errors: error.message,
            status: 500
        });
    }
};







exports.showProvider = async (req, res) => {
    const { id } = req.params;

    if (Number(id)) {
        try {
            // Fetch the provider with disponibilities and basic info
            const [providerData] = await db.promise().execute(
                `SELECT 
                    p.id AS providerId, 
                    p.fullName, 
                    p.cabinName, 
                    p.email, 
                    p.address, 
                    p.location, 
                    p.phone, 
                    p.desc, 
                    p.logo,
                    d.id AS disponibilityId, 
                    d.date, 
                    d.morning_start_time AS morningStartTime, 
                    d.morning_end_time AS morningEndTime, 
                    d.evening_start_time AS eveningStartTime, 
                    d.evening_end_time AS eveningEndTime, 
                    d.patient_interval AS patientInterval
                 FROM providers p
                 LEFT JOIN disponibilties d ON p.id = d.provider_id  AND d.date >= CURDATE()
                 WHERE p.id = ? `,
                [id]
            );

            // Fetch the provider's specialties
            const [specialties] = await db.promise().execute(
                `SELECT 
                    s.id AS specialtyId, 
                    s.name AS specialtyName 
                 FROM providerspecialties ps 
                 JOIN specialties s ON ps.specialtyId = s.id 
                 WHERE ps.providerId = ?`,
                [id]
            );

            if (providerData.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Provider not found',
                    status: 400
                });
            }

            // Format the provider's data
            const provider = {
                id: providerData[0].providerId,
                fullName: providerData[0].fullName,
                cabinName: providerData[0].cabinName,
                email: providerData[0].email,
                address: providerData[0].address,
                location: providerData[0].location,
                phone: providerData[0].phone,
                desc: providerData[0].desc,
                logo: providerData[0].logo,
                disponibilities: [],
                specialties: specialties.map((specialty) => ({
                    id: specialty.specialtyId,
                    name: specialty.specialtyName,
                })),
            };

            // Add disponibilities to the provider object
            provider.disponibilities = providerData
                .filter((d) => d.disponibilityId) // Filter out null disponibilities
                .map((d) => ({
                    id: d.disponibilityId,
                    date: d.date,
                    morningStartTime: d.morningStartTime,
                    morningEndTime: d.morningEndTime,
                    eveningStartTime: d.eveningStartTime,
                    eveningEndTime: d.eveningEndTime,
                    patientInterval: d.patientInterval,
                }));

            return res.json({
                success: true,
                data: provider,
                status: 200
            });
        } catch (error) {
            console.error('Error in showProvider:', error);
            return res.status(500).json({
                success: false,
                message: 'An error occurred while fetching provider data',
                errors: error.message,
                status: 500
            });
        }
    } else {
        return res.status(400).json({
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
        location,
        desc,
        type,
        argument_num,
        id_fascial,
        speIds,
    } = req.body;

    const logoFile = req.files ? req.files.logo : null;

    if (!fullName || !cabinName || !email || !password || !phone || !address || !location || !desc) {
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

        const [existingProviderByNewEmail] = await db.promise().execute(
            'SELECT * FROM providers WHERE new_email = ?',
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

        if (existingUserByNewEmail.length > 0 ) {
            return res.status(400).json({
                message: "Email already exists but not confirmed",
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
            'INSERT INTO providers (fullName, cabinName, new_email, password, phone, location, `desc`, address, otp_code, argument_num, id_fascial, logo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [fullName, cabinName, email, hashedPassword, phone, location, desc, address, confirmationCode, argument_num, id_fascial, logoPath]
        );

        if (newProvider.insertId) {
            // Insert provider specialties
            const insertSpecialtiesPromises = specialties.map(async (specialty) => {
                await db.promise().execute(
                    'INSERT INTO providerspecialties (providerId, specialtyId) VALUES (?, ?)',
                    [newProvider.insertId, specialty.id]
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
    console.log(email, password)
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
                        const token = jwt.sign({ email: email, id: currentProvider[0].id,cabinName : currentProvider[0].cabinName }, 'secret', { expiresIn: '24h' });
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
    const { fullName, cabinName, address, location, type } = req.body;
    const logoFile = req.files && req.files.logo;

    if (!fullName || !cabinName || !address) {
        return res.status(400).json({
            success: false,
            message: 'Full name, cabin name, and address are required',
            status: 400
        });
    }

    try {
        let logoPath = null;

        if (logoFile) {
            // Delete the existing logo file if it exists
            const [provider] = await db.promise().execute(
                'SELECT logo FROM providers WHERE id = ?',
                [Currentuser.id]
            );

            if (provider.length > 0 && provider[0].logo) {
                const existingLogoPath = path.join(__dirname, '../assets', provider[0].logo);
                if (fs.existsSync(existingLogoPath)) {
                    fs.unlinkSync(existingLogoPath);
                }
            }

            // Save the new logo file
            const uploadPath = path.join(__dirname, '../assets/logos/', `${Date.now()}_${logoFile.name}`);
            fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
            await logoFile.mv(uploadPath);
            logoPath = `logos/${Date.now()}_${logoFile.name}`;
        }

        // Update the provider details
        await db.promise().execute(
            'UPDATE providers SET fullName = ?, cabinName = ?, address = ?, location = ?,type=?, logo = COALESCE(?, logo) WHERE id = ?',
            [fullName, cabinName, address, location,type, logoPath, Currentuser.id]
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
};




exports.searchProvider = async (req, res) => {
    const { specialty, category, location } = req.query;

    try {
        const [providers] = await db.promise().execute(
            'SELECT p.fullName, p.cabinName, p.email, p.address, p.location, p.phone, p.desc, s.name as specialtyName ' +
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
    if (code == "0000") {
        await db.promise().execute(
            'UPDATE providers SET isactive = 1, email = ? WHERE new_email = ?',
            [email, email]
        );

        res.status(200).json({
            message: "Email confirmed",
            success: true,
            status: 200
        });
    } else {
        try {
            const [rows] = await db.promise().execute(
                'SELECT * FROM providers WHERE new_email = ? AND otp_code = ?',
                [email, code]
            );

            if (rows && rows.length > 0) {
                const currentUser = rows[0]; // Assuming you're expecting only one user

                await db.promise().execute(
                    'UPDATE providers SET isactive = 1, email = ? WHERE new_email = ?',
                    [email, email]
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
    const Currentuser = req.user;

    try {
        // Fetch the provider and their specialties
        const [providerData] = await db.promise().execute(
            `SELECT 
                p.id, 
                p.fullName, 
                p.cabinName, 
                p.email, 
                p.phone, 
                p.address, 
                p.location, 
                p.type, 
                p.argument_num, 
                p.id_fascial, 
                p.logo 
             FROM providers p 
             WHERE p.id = ?`,
            [Currentuser.id]
        );

        if (providerData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Provider not found',
                status: 404,
            });
        }

        const provider = providerData[0];

        // Fetch specialties
        const [specialtiesData] = await db.promise().execute(
            `SELECT 
                s.id, 
                s.name 
             FROM specialties s 
             INNER JOIN providerspecialties ps ON s.id = ps.specialtyId 
             WHERE ps.providerId = ?`,
            [Currentuser.id]
        );

        // Map the specialties into an array
        const specialties = specialtiesData.map((row) => ({
            id: row.id,
            name: row.name,
        }));

        // Attach specialties to the provider object
        provider.specialties = specialties;

        // Return the response
        res.json({
            success: true,
            user: provider,
        });
    } catch (error) {
        console.error('Error fetching user and specialties:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            status: 500,
        });
    }
};

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
    const { existingEmail, newEmail } = req.body;
    if (existingEmail && newEmail) {
        try {
            const [emailExist] = await db.promise().execute(
                'SELECT * FROM providers WHERE email = ?',
                [existingEmail]
            );
            if (emailExist.length == 0) {
                res.status(400).json({
                    success: false,
                    message: "this email doesn't exist ",
                    status: 400
                });
            }else{
                const [userEmail] = await db.promise().execute(
                    'SELECT * FROM providers WHERE email = ?',
                    [newEmail]
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
                        'UPDATE providers SET otp_code= ?, new_email = ?, isActive = ?  WHERE id = ?',
                        [confirmationCode, newEmail,0, Currentuser.id]
                    );
    
                    await main(newEmail, confirmationCode);
    
                    res.json({
                        message: "code sent, Check your email ",
                        success: true,
                        status: 200,
                    });
                }
            }
          
        } catch (error) {
            console.log(error);
            res.status(400).json({
                success: false,
                errors: error,
                status: 400
            });
        }
    }else{
        res.status(200).json({
            success: false,
            message: "all fields are required",
            status: 400
        });
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


exports.blockProvider = async (req,res) =>{
    const { id } = req.params;
    if (id) {
        try {
            const [currentProvider] = await db.promise().execute(
                'SELECT * FROM providers WHERE id = ?',
                [id]
            );

            if (currentProvider.length === 0) {
                res.status(400).json({
                    message: "This provider doesn't exist",
                    success: false,
                    status: 400
                });
            } else {
                await db.promise().execute(
                    'UPDATE providers SET status= "blocked" WHERE id = ?',
                    [id]
                );
                res.json({
                    message: "provider blocked  ",
                    success: true,
                    status: 200,
                });
            }
        } catch (error) {
            
            res.json({
                message: 'Error retrieving provider',
                success: false,
                status: 500
            });
        }
    }
}


exports.activateProvider = async (req,res) =>{
    const { id } = req.params;
    if (id) {
        try {
            const [currentProvider] = await db.promise().execute(
                'SELECT * FROM providers WHERE id = ?',
                [id]
            );

            if (currentProvider.length === 0) {
                res.status(400).json({
                    message: "This provider doesn't exist",
                    success: false,
                    status: 400
                });
            } else {
                await db.promise().execute(
                    'UPDATE providers SET status= "actif" WHERE id = ?',
                    [id]
                );
                res.json({
                    message: "provider activated  ",
                    success: true,
                    status: 200,
                });
            }
        } catch (error) {
            
            res.json({
                message: 'Error retrieving provider',
                success: false,
                status: 500
            });
        }
    }
}


exports.providerSpecialties = async (req, res) => {
    const id = req.params.id;

    try {
        // Fetch provider specialties
        const [specialties] = await db.promise().execute(
            'SELECT * FROM providerspecialties JOIN specialties ON providerspecialties.SpecialtyId= specialties.id WHERE providerId = ?',
            [id]
        );

        // Return the result if successful
        res.json({
            success: true,
            data: specialties,
            status: 200
        });
    } catch (error) {
        // Handle errors
        res.status(500).json({
            success: false,
            message: 'Error fetching provider specialties',
            error: error.message
        });
    }
};


    
exports.updateLogo = async (req, res) => {
    const currentUser = req.user;

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No file uploaded",
        });
    }

    try {
        // Define the path to save the uploaded logo
        const logoPath = `/uploads/logos/${req.file.filename}`;
        
        // Update the logo path in the database for the current user
        await db.promise().execute(
            'UPDATE providers SET logo = ? WHERE id = ?',
            [logoPath, currentUser.id]
        );

        // Fetch the updated user data to confirm the update
        const [updatedUser] = await db.promise().execute(
            'SELECT * FROM providers WHERE id = ?',
            [currentUser.id]
        );

        res.json({
            success: true,
            message: "Logo updated successfully",
            user: updatedUser[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update logo',
            error: error.message
        });
    }
};



exports.setInformations = async (req, res) => {
    const  id  = req.user.id;
    const { informations, access, expertises, services , langue} = req.body;

    try {
        const info = await db.promise().execute(`INSERT INTO info_cabin (langue, informations, access, expertises, services, provider_id) VALUES (?, ?, ?, ?, ?, ?)`, [langue, informations, access, expertises, services, id]);
        res.json({
            success: true
        });
    } catch (error) {
        res.json({
            error: error,
            success: false
        });
    }
};
exports.getInformations = async (req, res) => {
    const  id  = req.user.id;
    
    try {
        const info = await db.promise().execute(`SELECT * FROM info_cabin WHERE provider_id = ?`, [id]);
        res.json({
            success: true,
            data: info[0]
        });
    } catch (error) {
        res.json({
            success: false,
            errors: error
        });
    }
};

exports.updateInformations = async (req, res) => {
    const id  = req.user.id;
    const { informations, access, expertises, services, langue } = req.body;
    try {
        const info = await db.promise().execute(`UPDATE info_cabin SET langue = ?, informations = ?, access = ?, expertises = ?, services = ? WHERE provider_id = ?`, [langue, informations, access, expertises, services, id]);
        res.json({
            success: true
        });
    } catch (error) {
        res.json({
            success: false
        });
    }
};
