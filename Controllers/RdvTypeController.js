const db = require('../config/config');

exports.allTypes = async (req, res) => {
    try {
        const [types] = await db.promise().execute(
            'SELECT * FROM rdv_motifs'
        );

        res.json({
            success: true,
            data: types,
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

exports.CreateType = async (req, res) => {
    const { name } = req.body;

    if (name) {
        try {
            await db.promise().execute(
                'INSERT INTO rdv_motifs (name) VALUES (?)',
                [name]
            );

            res.json({
                message: 'Type created',
                success: true,
                status: 200
            });
        } catch (error) {
            console.log(error);
            res.json({
                message: 'Error creating Type',
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

exports.UpdateType = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (Number(id) && name) {
        try {
            const [Type] = await db.promise().execute(
                'SELECT * FROM rdv_motifs WHERE id = ?',
                [id]
            );

            if (Type.length > 0) {
                await db.promise().execute(
                    'UPDATE rdv_motifs SET name = ? WHERE id = ?',
                    [name, id]
                );

                res.json({
                    message: 'Type updated',
                    success: true,
                    status: 200
                });
            } else {
                res.json({
                    message: 'Type not found',
                    success: false,
                    status: 400
                });
            }
        } catch (error) {
            console.log(error);
            res.json({
                message: 'Error updating Type',
                success: false,
                status: 500
            });
        }
    } else {
        res.json({
            message: 'Invalid id or empty field',
            success: false,
            status: 400
        });
    }
};

exports.deleteType = async (req, res) => {
    const { id } = req.params;

    if (Number(id)) {
        try {
            const [Type] = await db.promise().execute(
                'SELECT * FROM rdv_motifs WHERE id = ?',
                [id]
            );

            if (Type.length > 0) {
                await db.promise().execute(
                    'DELETE FROM rdv_motifs WHERE id = ?',
                    [id]
                );

                res.json({
                    message: 'Type deleted',
                    success: true,
                    status: 200
                });
            } else {
                res.json({
                    message: 'Type not found',
                    success: false,
                    status: 400
                });
            }
        } catch (error) {
            console.log(error);
            res.json({
                message: 'Error deleting Type',
                success: false,
                status: 500
            });
        }
    } else {
        res.json({
            message: 'Invalid id',
            success: false,
            status: 400
        });
    }
};
