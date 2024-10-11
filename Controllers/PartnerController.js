const db = require('../config/config');
const { v4: uuidv4 } = require('uuid');

exports.getAll = async (req, res) => {
    const user = req.user
    
    try {
        const [partners] = await db.promise().execute(
            'SELECT * FROM partners '
        );

        res.json({
            success: true,
            data: partners,
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
    const {name, percentage, object, conditions} = req.body
    if (name && percentage && object && conditions) {
        const code = uuidv4();
        try {
            await db.promise().execute(
                'INSERT INTO partners (name, percentage, object, conditions,code) VALUES (?, ?,?,? ,?)',
                        [name, percentage, object, conditions,code]
                    );
                    res.json({
                        message: 'partner created',
                        success: true,
                        status: 200
                    });
        } catch (error) {
            console.log(error);
            res.json({
                message: 'Error creating partner',
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