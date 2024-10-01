const db = require('../config/config');
const saltRound = 10;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')


exports.getAll = async (req, res) => {
    const user = req.user
    let admin = null
    try {
        const [admins] = await db.promise().execute(
            'SELECT username, id FROM super_admins where super = ? ', [false]
        );

        res.json({
            success: true,
            data: admins,
            status: 200
        });
    } catch (error) {
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
            bcrypt.hash(password, saltRound, async (err, hash) => {
                if (!err) {
                    await db.promise().execute(
                        'INSERT INTO super_admins (username,password) VALUES (?, ?)',
                        [username, hash]
                    );
                    res.json({
                        message: 'admin created',
                        success: true,
                        status: 200
                    });

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
            res.json({
                message: 'Error creating admin',
                success: false,
                status: 500
            });
        }
    } else {
        res.json({
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



            bcrypt.compare(password, user[0].password, (err, result) => {
                if (result) {
                    const token = jwt.sign({ username: username, id: user[0].id, admin: user[0].admin }, 'secret', { expiresIn: '24h' });
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