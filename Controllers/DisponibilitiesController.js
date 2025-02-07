const db = require('../config/config');

exports.ProviderDisponibilities = async (req, res) => {
    const providerId = req.user.id;

    const test = "test";
    console.log(test);
    try {
        // SQL query to retrieve provider's disponibilities with updated fields
        const [dispo] = await db.promise().execute(
            `SELECT 
                d.date,
                d.morning_start_time AS morningStartTime,
                d.morning_end_time AS morningEndTime,
                d.evening_start_time AS eveningStartTime,
                d.evening_end_time AS eveningEndTime,
                d.patient_interval AS patientInterval,
                d.status
             FROM disponibilties d
             JOIN providers p ON d.provider_id = p.id
             WHERE p.id = ? AND d.status = 1 AND d.date >= CURDATE()
             ORDER BY d.date ASC`,
            [providerId]
        );
        dispo.forEach(entry => {
            entry.date = new Date(new Date(entry.date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        });

        res.json({  
            success: true,
            data: dispo,
            status: 200
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            errors: error.message,
            status: 500
        });
    }
};



exports.setProviderAvailability = async (req, res) => {
    const providerId = req.user.id; // Assuming req.user contains the authenticated provider’s data
    const dayNameToIndex = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
    };
    // Extract and validate request body
    const { availability, date, excludedDays } = req.body;

    if (!availability || !date || !excludedDays) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields in request body",
        });
    }

    const { from, to } = date;
    const { morningStartTime, morningEndTime, eveningStartTime, eveningEndTime, patientInterval, status } = availability;

    if (!from || !to || !morningStartTime || !morningEndTime || !eveningStartTime || !eveningEndTime || !patientInterval || typeof status !== 'number') {
        return res.status(400).json({
            success: false,
            message: "Invalid or incomplete availability data",
        });
    }

    try {
        let currentDate = new Date(from);
        const endDate = new Date(to);

        // Ensure the start date is not after the end date
        if (currentDate > endDate) {
            return res.status(400).json({
                success: false,
                message: "Start date cannot be after end date",
            });
        }

        while (currentDate <= endDate) {
            const currentDateStr = currentDate.toISOString().split('T')[0]; // Format date as 'YYYY-MM-DD'
            const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
            console.log("Processing date:", currentDateStr);
            console.log("dayOfWeek:", dayOfWeek);
            // Convert excludedDays (day names) to numeric indices
            const excludedDayIndices = excludedDays.map(dayName => dayNameToIndex[dayName.trim()]);

            // Check if the current day is excluded
            const finalStatus = excludedDayIndices.includes(dayOfWeek) ? 0 : status;

            // Insert availability for the current day into the database
            await db.promise().execute(
                'INSERT INTO disponibilties (provider_id, date, morning_start_time, morning_end_time, evening_start_time, evening_end_time, patient_interval, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    providerId,
                    currentDateStr,
                    morningStartTime,
                    morningEndTime,
                    eveningStartTime,
                    eveningEndTime,
                    patientInterval,
                    finalStatus,
                ]
            );

            // Move to the next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        res.json({
            success: true,
            message: "Provider availability updated successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error updating availability",
            error: error.message,
        });
    }
};
exports.updateProviderAvailability = async (req, res) => {
    const providerId = req.user.id; // Assuming req.user contains the authenticated provider’s data
    const { availability, date } = req.body;
    const { from, to } = date;
 

    try {
        let currentDate = new Date(from);
        const endDate = new Date(to);

        // Validate the received data
        if (!availability || !from || !to || !providerId) {
            return res.status(400).json({
                success: false,
                message: "Invalid data provided",
            });
        }

        console.log("Received data:", { providerId, availability, from, to });

        // Loop through each date in the range
        while (currentDate <= endDate) {
            const currentDateStr = currentDate.toISOString().split('T')[0]; // Format date as 'YYYY-MM-DD'

            const {
                morningStartTime,
                morningEndTime,
                eveningStartTime,
                eveningEndTime,
                patientInterval,
                status,
            } = availability;

            try {
                // Check if an entry for the provider and specific date already exists
                const [existingAvailability] = await db
                    .promise()
                    .execute(
                        'SELECT id FROM disponibilties WHERE provider_id = ? AND date = ?',
                        [providerId, currentDateStr]
                    );

                console.log("Processing date:", currentDateStr);
                console.log("existingAvailability:", existingAvailability);

                if (existingAvailability.length > 0) {
                    // Update the existing entry
                    const [updateResult] = await db.promise().execute(
                        `UPDATE disponibilties 
                         SET morning_start_time = ?, morning_end_time = ?, 
                             evening_start_time = ?, evening_end_time = ?, 
                             patient_interval = ?, status = ?
                         WHERE provider_id = ? AND date = ?`,
                        [
                            morningStartTime,
                            morningEndTime,
                            eveningStartTime,
                            eveningEndTime,
                            patientInterval,
                            status,
                            providerId,
                            currentDateStr,
                        ]
                    );
                    console.log("Update result:", updateResult);
                } else {
                    // Insert a new entry if none exists for this date
                    const [insertResult] = await db.promise().execute(
                        `INSERT INTO disponibilties 
                         (provider_id, date, morning_start_time, morning_end_time, 
                          evening_start_time, evening_end_time, patient_interval, status) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            providerId,
                            currentDateStr,
                            morningStartTime,
                            morningEndTime,
                            eveningStartTime,
                            eveningEndTime,
                            patientInterval,
                            status,
                        ]
                    );
                    console.log("Insert result:", insertResult);
                }
            } catch (queryError) {
                console.error(
                    `Error updating/creating availability for ${currentDateStr}:`,
                    queryError
                );
            }

            // Move to the next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        res.json({
            success: true,
            message: "Provider availability updated successfully",
        });
    } catch (error) {
        console.error("Error in updateProviderAvailability:", error);
        res.status(500).json({
            success: false,
            message: "Error updating availability",
        });
    }
};

exports.getDays = async (req, res) => {
    try {
        const [days] = await db.promise().execute('SELECT * FROM days');
        res.json({
            success: true,
            data: days,
            status: 200
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            errors: error.message,
            status: 500
        });
    }
};
