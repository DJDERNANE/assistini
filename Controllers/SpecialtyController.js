const db = require('../config/config');

exports.allSpecialties = async (req, res) => {
    try {
        const [specialties] = await db.promise().execute(
            'SELECT s.id, s.name, c.name AS category_name FROM specialties s JOIN categories c ON s.categoryId = c.id'
        );

        res.json({
            success: true,
            data: specialties,
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

exports.searchSpecialty = async (req, res) => {
    const { specialty } = req.query;
    try {
        const [specialtys] = await db.promise().execute(
            'SELECT * FROM specialties WHERE name LIKE ?',
            [`%${specialty}%`]
        );

        res.json({
            success: true,
            data: specialtys,
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

exports.CreateSpecialty = async (req, res) => {
    const { name, catId, description } = req.body;
    
    if (name && catId) {
        try {
            const categoryExist = await db.promise().execute(
                'SELECT * FROM categories WHERE id = ?',
                [catId]
            );

            if (categoryExist.length > 0) {
                await db.promise().execute(
                    'INSERT INTO specialties (name, description, categoryId) VALUES (?, ?, ?)',
                    [name, description,catId]
                );

                res.json({
                    message: "Specialty created",
                    success: true,
                    status: 200
                });
            } else {
                res.status(400).json({
                    message: "Category not found",
                    success: false,
                    status: 400
                });
            }
        } catch (error) {
            console.log(error);
            res.json({
                message: "Error creating Specialty",
                success: false,
                status: 500
            });
        }
    } else {
        res.status(400).json({
            message: "All fields are required",
            success: false,
            status: 400
        });
    }
};

exports.UpdateSpecialty = async (req, res) => {
    const { id } = req.params;
    const { name, catId } = req.body;

    if (Number(id) && Number(catId) && name) {
        try {
            const categoryExist = await db.promise().execute(
                'SELECT * FROM categories WHERE id = ?',
                [catId]
            );

            if (categoryExist.length > 0) {
                const specialty = await db.promise().execute(
                    'SELECT * FROM specialties WHERE id = ?',
                    [id]
                );

                if (specialty.length > 0) {
                    await db.promise().execute(
                        'UPDATE specialties SET name = ?, categoryId = ? WHERE id = ?',
                        [name, catId, id]
                    );

                    res.json({
                        message: "Specialty updated",
                        success: true,
                        status: 200
                    });
                } else {
                    res.status(400).json({
                        message: "Specialty not found",
                        success: false,
                        status: 400
                    });
                }
            } else {
                res.status(400).json({
                    message: "Category not found",
                    success: false,
                    status: 400
                });
            }
        } catch (error) {
            console.log(error);
            res.json({
                message: "Error updating Specialty",
                success: false,
                status: 500
            });
        }
    } else {
        res.status(400).json({
            message: "Invalid id or empty field",
            success: false,
            status: 400
        });
    }
};

exports.deleteSpecialty = async (req, res) => {
    const { id } = req.params;

    if (Number(id)) {
        try {
            const specialty = await db.promise().execute(
                'SELECT * FROM specialties WHERE id = ?',
                [id]
            );

            if (specialty.length > 0) {
                await db.promise().execute(
                    'DELETE FROM specialties WHERE id = ?',
                    [id]
                );

                res.json({
                    message: "Specialty deleted",
                    success: true,
                    status: 200
                });
            } else {
                res.status(400).json({
                    message: "Specialty not found",
                    success: false,
                    status: 400
                });
            }
        } catch (error) {
            console.log(error);
            res.json({
                message: "Error deleting Specialty",
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

exports.specialtiesOfCat = async (req, res) => {
    const { catId } = req.query;

    try {
        const [specialties] = await db.promise().execute(
            'SELECT * FROM specialties WHERE categoryId = ?',
            [catId]
        );

        res.json({
            data: specialties
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            errors: error
        });
    }
};
