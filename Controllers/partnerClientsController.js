const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const db = require('../config/config');

// Set up Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'assets/'); // Folder to store uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Name the file uniquely
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
}).single('documents'); // Expecting a single file input named 'documents'

exports.add = async (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer Error:', err);
            return res.status(400).json({ success: false, message: 'Multer error occurred', error: err });
        } else if (err) {
            console.error('Unknown Error:', err);
            return res.status(500).json({ success: false, message: 'File upload error', error: err });
        }

        if (!req.file) {
            console.error('No file uploaded:', req.file);
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        try {
            // Get the path of the uploaded file
            const filePath = req.file.path;

            // Load the uploaded Excel file
            const workbook = xlsx.readFile(filePath);

            // Get the first sheet
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            // Convert sheet to JSON
            const clients = xlsx.utils.sheet_to_json(sheet);

            // Insert each client into the database (Commented out for testing)
            // for (let client of clients) {
            //     const { matricule, compagnie_assurance, num_assurance } = client;
            //     if (matricule && compagnie_assurance && num_assurance) {
            //         // Insert into the database
            //         await db.promise().execute(
            //             'INSERT INTO clients (matricule, compagnie_assurance, num_assurance) VALUES (?, ?, ?)',
            //             [matricule, compagnie_assurance, num_assurance]
            //         );
            //     }
            // }

            // Delete the file after processing
            fs.unlinkSync(filePath);

            res.status(200).json({ success: true, message: 'File processed and data inserted successfully' });
        } catch (error) {
            console.error('Error processing file:', error);
            res.status(500).json({ success: false, message: 'Error processing file', error });
        }
    });
};



exports.test = async (req, res) => {
    try {
        const partner = req.params.partner;
        const Docs = req.files ? req.files.docs : null;

        const files = Array.isArray(Docs) ? Docs : [Docs];
        let insertedRowsCount = 0; // Move this variable outside the loop

        for (let file of files) {
            console.log(file.name);
            const uploadPath = path.join(__dirname, '../assets/partnerClients/', `${Date.now()}_${file.name}`);
            fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
            await file.mv(uploadPath);

            // Read the Excel file
            const workbook = xlsx.readFile(uploadPath);
            const sheet_name_list = workbook.SheetNames;
            console.log('Sheets name list:', sheet_name_list);

            // Convert the first sheet to JSON
            const xlData = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
            console.log('All xlData:', xlData);

            // Insert each row into the database
            for (const client of xlData) {
                const { matricule, compagnie_assurance, num_assurance } = client;

                // Check if any required field is missing or empty
                if (!matricule || !compagnie_assurance || !num_assurance) {
                    console.log(`Skipping row due to missing data: ${JSON.stringify(client)}`);
                    continue; // Skip to the next row
                }

                try {
                    await db.promise().execute(
                        'INSERT INTO partnerclients (matricule, compagnie_assurance, num_assurance, partnerId) VALUES (?, ?, ?, ?)',
                        [matricule, compagnie_assurance, num_assurance, partner]
                    );
                    insertedRowsCount++; // Increment the counter for each successful insert
                } catch (err) {
                    console.error(`Error inserting data for matricule: ${matricule}`, err);
                    // Continue to process the next row even if there's an error
                }
            }
        }

        // Send the response only after all files have been processed
        res.status(200).json({
            success: true,
            message: 'Files processed and data inserted successfully',
            insertedRows: insertedRowsCount
        });

    } catch (error) {
        console.error('Error processing file or inserting data:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing file or inserting data',
            error
        });
    }
};

