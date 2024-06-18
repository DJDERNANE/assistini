const db = require('../config/config');

exports.allCategories = async (req, res) => {
    try {
        const [cats] = await db.promise().execute('SELECT * FROM categories');
        res.json({
            success: true,
            data: cats,
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

exports.searchCategory = async (req, res) => {
    const { cat } = req.query;
    try {
        const [cats] = await db.promise().execute('SELECT * FROM categories WHERE name LIKE ?', [`%${cat}%`]);
        res.json({
            success: true,
            data: cats,
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

exports.CreateCategory = async (req, res) => {
    const { Cat_name } = req.body;
    if (Cat_name) {
        try {
            await db.promise().execute('INSERT INTO categories (name) VALUES (?)', [Cat_name]);
            res.json({
                message: "Category created...",
                success: true,
                status: 200
            });
        } catch (error) {
            res.json({
                message: "Error creating category",
                success: false,
                errors: error,
                status: 500
            });
        }
    } else {
        res.json({
            message: "All fields are required...",
            success: false,
            status: 400
        });
    }
};

exports.UpdateCategory = async (req, res) => {
    const { id } = req.params;
    const { Cat_name } = req.body;

    if (Number(id) && Cat_name) {
        try {
            const [result] = await db.promise().execute('UPDATE categories SET name = ? WHERE id = ?', [Cat_name, id]);

            if (result.affectedRows > 0) {
                res.json({
                    message: "Category updated",
                    success: true,
                    status: 200
                });
            } else {
                res.json({
                    message: "No Category found",
                    success: false,
                    status: 400
                });
            }
        } catch (error) {
            res.json({
                message: "Error updating category",
                success: false,
                errors: error,
                status: 500
            });
        }
    } else {
        res.json({
            message: "Invalid id or empty field",
            success: false,
            status: 400
        });
    }
};

exports.deleteCategory = async (req, res) => {
    const { id } = req.params;

    if (Number(id)) {
        try {
            const [result] = await db.promise().execute('DELETE FROM categories WHERE id = ?', [id]);

            if (result.affectedRows > 0) {
                res.json({
                    message: "Category deleted",
                    success: true,
                    status: 200
                });
            } else {
                res.json({
                    message: "No Category found",
                    success: false,
                    status: 400
                });
            }
        } catch (error) {
            res.json({
                message: "Error deleting category",
                success: false,
                errors: error,
                status: 500
            });
        }
    } else {
        res.json({
            message: "Invalid id",
            success: false,
            status: 400
        });
    }
};
