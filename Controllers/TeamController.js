const db = require('../config/config');
const saltRound = 10;
const bcrypt = require('bcrypt');



// exports.getAll = async (req, res) => {
//     const user = req.user
//     try {
//         const [subAdmins] = await db.promise().execute(
//             'SELECT username, id FROM sub_admins where admin = ? ', [user.id]
//         );

//         res.json({
//             success: true,
//             data: subAdmins,
//             status: 200
//         });
//     } catch (error) {
//         res.json({
//             success: false,
//             errors: error,
//             status: 500
//         });
//     }
// };

exports.create = async (req, res) => {
    const { name } = req.body;
    const user = req.user

    if (name && user) {
        try {
            await db.promise().execute(
                'INSERT INTO teams (admin, name) VALUES (?, ?)',
                [user.id, name]
            );
            res.json({
                message: 'team created',
                success: true,
                status: 200
            });
        } catch (error) {
            console.log(error);
            res.json({
                message: 'Error creating team',
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

exports.deleteTeam = async (req, res) => {
    const { id } = req.params;

    if (Number(id)) {
        try {
            const teams = await db.promise().execute(
                'SELECT * FROM teams WHERE id = ?',
                [id]
            );

            if (teams.length > 0) {
                await db.promise().execute(
                    'DELETE FROM teams WHERE id = ?',
                    [id]
                );

                res.json({
                    message: "team deleted",
                    success: true,
                    status: 200
                });
            } else {
                res.status(400).json({
                    message: "team not found",
                    success: false,
                    status: 400
                });
            }
        } catch (error) {
            console.log(error);
            res.json({
                message: "Error deleting team",
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