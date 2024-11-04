const db = require('../config/config'); // Assuming you have db configuration

// Create a new person
exports.create = async (req, res) => {
    const { name, assurance, prenom, sex, motif, residance, birthday, email, phone, company } = req.body;
    const userId = req.user.id; // Get userId from authenticated user

    const query = `
        INSERT INTO my_patients (name, assurance, prenom, sex, motif, residance, birthday, email, phone, company, userId) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [name, assurance, prenom, sex, motif, residance, birthday, email, phone, company, userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        res.status(201).json({ message: 'Person created successfully', id: results.insertId });
    });
};

// Get all persons (for the authenticated user)
exports.getAll = async (req, res) => {
    const userId = req.user.id; // Get userId from authenticated user

    const query = `SELECT * FROM my_patients WHERE userId = ?`;

    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({data: results});
    });
};

// Get person by ID (for the authenticated user)
exports.getPersonById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id; // Get userId from authenticated user

    const query = `SELECT * FROM my_patients WHERE id = ? AND userId = ?`;

    db.query(query, [id, userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Person not found' });

        res.json({data : results[0]});
    });
};

// Update person by ID (for the authenticated user)
exports.updatePerson = async (req, res) => {
    const { id } = req.params;
    const { name, assurance, prenom, sex, motif, residance, birthday, email, phone, company } = req.body;
    const userId = req.user.id; // Get userId from authenticated user

    const query = `
        UPDATE persons SET name = ?, assurance = ?, prenom = ?, sex = ?, motif = ?, residance = ?, 
        birthday = ?, email = ?, phone = ?, company = ?
        WHERE id = ? AND userId = ?
    `;

    db.query(query, [name, assurance, prenom, sex, motif, residance, birthday, email, phone, company, id, userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.affectedRows === 0) return res.status(404).json({ error: 'Person not found or not authorized' });

        res.status(200).json({ message: 'Person updated successfully' });
    });
};

// Delete person by ID (for the authenticated user)
exports.deletePerson = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id; // Get userId from authenticated user

    const query = `DELETE FROM my_patients WHERE id = ? AND userId = ?`;

    db.query(query, [id, userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.affectedRows === 0) return res.status(404).json({ error: 'Person not found or not authorized' });

        res.status(200).json({ message: 'Person deleted successfully' });
    });
};
