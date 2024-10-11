const db = require('../config/config');
const saltRound = 10;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { create } = require('./InvoiceController');


exports.getAll = async (req, res) => {
    const user = req.user
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 6; // Ensure pageSize is an integer
    const offset = (page - 1) * pageSize; // Ensure offset is an integer
    try {
        const [admins] = await db.promise().execute(
            `SELECT * FROM super_admins LIMIT ${pageSize} OFFSET ${offset}`
        );

        const [total] = await db.promise().execute(
            `SELECT COUNT(*) AS totalCount FROM super_admins`
        );
    
        // Map the results to add a role based on the value of the `super` column
        const adminsWithRoles = admins.map(admin => ({
            username: admin.username,
            id: admin.id,
            role: admin.super ? 'admin' : 'subadmin',  // Assign 'admin' if super is true, otherwise 'subadmin'
            created_at: admin.created_at
        }));
        const totalRecords = total[0].totalCount; 
        res.json({
            success: true,
            data: adminsWithRoles,
            meta: {
                totalRecords: totalRecords,
                currentPage: page,
                pageSize: pageSize,
                totalPages: Math.ceil(totalRecords / pageSize) // Correct totalPages calculation
            },
            status: 200
        });
    } catch (error)  {
        res.json({
            success: false,
            errors: error,
            status: 500
        });
    }
};

exports.add = async (req, res) => {
    const { username, password } = req.body;
    
    if (username && password) {
        try {
            // Check if the username already exists
            const [existingUser] = await db.promise().execute(
                'SELECT id FROM super_admins WHERE username = ?',
                [username]
            );
            
            if (existingUser.length > 0) {
                // Username is already taken
                return res.status(400).json({
                    message: 'Username already exists',
                    success: false,
                    status: 400
                });
            }

            // Hash the password
            bcrypt.hash(password, saltRound, async (err, hash) => {
                if (!err) {
                    // Insert the new admin into the database
                    const [newUser] = await db.promise().execute(
                        'INSERT INTO super_admins (username, password) VALUES (?, ?)',
                        [username, hash]
                    );
                    res.json({
                        message: 'Admin created successfully',
                        success: true,
                        userId: newUser.insertId,  // Return the new admin's ID
                        status: 200
                    });
                } else {
                    // Hashing error
                    res.status(400).json({
                        message: 'Hashing error',
                        success: false,
                        error: err.message,
                        status: 400
                    });
                }
            });
        } catch (error) {
            // Handle errors
            console.error(error);
            res.status(500).json({
                message: 'Error creating admin',
                success: false,
                status: 500
            });
        }
    } else {
        // Missing fields
        res.status(400).json({
            message: 'All fields are required',
            success: false,
            status: 400
        });
    }
};


exports.deleteAdmin = async (req, res) => {
    const { id } = req.params;

    if (Number(id)) {
        try {
            const Admin = await db.promise().execute(
                'SELECT * FROM super_admins WHERE id = ?',
                [id]
            );

            if (Admin.length > 0) {
                await db.promise().execute(
                    'DELETE FROM super_admins WHERE id = ?',
                    [id]
                );

                res.json({
                    message: "Admin deleted",
                    success: true,
                    status: 200
                });
            } else {
                res.status(400).json({
                    message: "Admin not found",
                    success: false,
                    status: 400
                });
            }
        } catch (error) {
            res.json({
                message: "Error deleting Admin",
                success: false,
                status: 500
            });
        }
    } else {
        res.status(400).json({
            message: "Invalid id",
            success: false,
            status: 400
        });
    }
};


exports.Login = async (req, res) => {
    const { username, password } = req.body;
    if (username && password) {
        try {
            const [user] = await db.promise().execute(
                'SELECT * FROM super_admins WHERE username = ?',
                [username]
            );

            if (user.length === 0) {
                res.status(400).json({
                    message: "This Username doesn't exist",
                    success: false,
                    status: 400
                });
            }


            const role = user[0].super ?  'admin' : 'subadmin'
            bcrypt.compare(password, user[0].password, (err, result) => {
                if (result) {
                    const token = jwt.sign({ username: username, id: user[0].id }, 'secret', { expiresIn: '24h' });
                    res.json({
                        message: "Logged In",
                        success: true,
                        status: 200,
                        role: role,
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
        } catch (error) {
            console.log(error);
            res.status(400).json({
                message: "Error fetching user",
                success: false,
                status: 400
            });
        }
    }
    // res.status(200).json({
    //     message: username,
    //     success: true,
    //     status: 200
    // });
};


exports.me = async (req, res) => {
    const Currentuser = req.user
    try {
        const [user] = await db.promise().execute(
            'SELECT * FROM super_admins WHERE id = ?',
            [Currentuser.id]
        );
        const currentUser= {
            username: user[0].username,
            id: user[0].id,
            role: user[0].super? 'admin' : 'subadmin'
        }
        res.json({
            success: true,
            data: currentUser
        })
    } catch (error) {
        res.status(500).json({
            success: true,
            error: error
        })
    }
}



