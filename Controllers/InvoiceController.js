const db = require('../config/config');
var { main } = require('../Componenets/MailComponent');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs'); // Import ejs module
const puppeteer = require('puppeteer'); // Import puppeteer module
const PDFDocument = require('pdfkit');

// exports.create = async (req, res) => {
//     const { rdvId, serviceIds, total } = req.body
//     const provider = req.user
//     console.log(provider)
//     let partnerId = null
//     let serviceIdsArray = Array.isArray(serviceIds) ? serviceIds : [serviceIds];
//     try {

//         // const [ispartner] = await db.promise().execute(
//         //     'SELECT * FROM partnerclients where (SELECT users.id FROM users JOIN rdvs ON users.id = rdvs.UserId WHERE rdvs.id = ? )',
//         //     [rdvId]
//         // )

//         // if (ispartner.length > 0) {
//         //     partnerId = ispartner[0].partnerId
//         //     const [partner] = await db.promise().execute(
//         //         'SELECT * FROM partners where id = ? ',
//         //         [partnerId]
//         //     )
//         // }

//         // Insert into invoices
//         const [invoiceResult] = await  db.promise().execute(
//             'INSERT INTO invoices (rdv_id, total_price, partner_id) VALUES (?, ?, ?)',
//             [rdvId, total, partnerId]
//         );


//         for (const serviceId of serviceIdsArray) {
//             const [services] = await  db.promise().execute(
//                 `SELECT * FROM services WHERE id = ?`,[serviceId]
//             );

//             if (services.length > 0) {
//                 // Prepare bulk insert data
//                 const invoiceDetailsData =  await services.map(service => [
//                       db.promise().execute(
//                         'INSERT INTO invoice_details (invoice_id, service, price) VALUES (?,?,?)',
//                         [invoiceResult.insertId, service.nom, service.price]
//                     )
//                 ]);

//             }

//         }


//             res.json({
//                 success: true,
//                 status: 200
//             });






//     } catch (error) {
//         console.error(error)
//         res.json({
//             success: false,
//             errors: error,
//             status: 500
//         });
//     }

// }

exports.create = async (req, res) => {
    const { rdvId, serviceIds, total } = req.body;
    const provider = req.user; // The current user (provider)
    let partnerId = null;
    let serviceIdsArray = Array.isArray(serviceIds) ? serviceIds : [serviceIds];
    let services = []; // Declare services variable here

    try {
        // Check if the RDV belongs to a partner
        const [isPartner] = await db.promise().execute(
            `SELECT partnerId FROM partnerclients 
             WHERE userId = (SELECT users.id FROM users JOIN rdvs ON users.id = rdvs.userId WHERE rdvs.id = ?)`,
            [rdvId]
        );

        if (isPartner.length > 0) {
            partnerId = isPartner[0].partnerId;
            const [partner] = await db.promise().execute(
                'SELECT * FROM partners WHERE id = ?',
                [partnerId]
            );

            if (partner.length > 0) {
                // Calculate the split amounts
                const partnerPercentage = partner[0].percentage / 100; // Convert percentage to a decimal
                const partnerAmount = total * partnerPercentage; // Amount for the partner
                const userAmount = total - partnerAmount; // Amount for the user

                // Insert into invoices
                const [invoiceResult] = await db.promise().execute(
                    'INSERT INTO invoices (rdv_id, total_price, partner_id) VALUES (?, ?, ?)',
                    [rdvId, total, partnerId]
                );

                // Insert invoice details for services
                for (const serviceId of serviceIdsArray) {
                    const [service] = await db.promise().execute(
                        `SELECT * FROM services WHERE id = ?`, [serviceId]
                    );

                    if (service.length > 0) {
                        services.push(service[0]); // Push service into services array
                        await db.promise().execute(
                            'INSERT INTO invoice_details (invoice_id, service, price) VALUES (?, ?, ?)',
                            [invoiceResult.insertId, service[0].nom, service[0].price]
                        );
                    }
                }

                // Generate PDF for partner
                const partnerInvoiceData = {
                    rdvId,
                    patient: 'Patient Name', // Replace with actual patient data
                    provider: { name: provider.name }, // Assuming provider data contains a name property
                    services: services,
                    payment: {
                        user: { amount: userAmount },
                        partner: { amount: partnerAmount },
                    },
                    invoice_id: invoiceResult.insertId,
                };

                const partnerPDFPath = await generateInvoicePDF(partnerInvoiceData, 'partner', invoiceResult.insertId);

                // Insert into partner payments with PDF path
                await db.promise().execute(
                    'INSERT INTO partner_payment (invoice_id, total, pdf_path) VALUES (?, ?, ?)',
                    [invoiceResult.insertId, partnerAmount, partnerPDFPath]
                );

                // Generate PDF for patient
                const patientPDFPath = await generateInvoicePDF(partnerInvoiceData, 'patient', invoiceResult.insertId);

                // Insert into user payments with PDF path
                await db.promise().execute(
                    'INSERT INTO patient_payment (invoice_id, total, pdf_path) VALUES (?, ?, ?)',
                    [invoiceResult.insertId, userAmount, patientPDFPath]
                );

                res.json({
                    success: true,
                    status: 200
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Partner not found',
                    status: 404
                });
            }
        } else {
            // If there is no partner, just insert the invoice without splitting
            const [invoiceResult] = await db.promise().execute(
                'INSERT INTO invoices (rdv_id, total_price) VALUES (?, ?)',
                [rdvId, total]
            );

            // Insert invoice details for services
            for (const serviceId of serviceIdsArray) {
                const [service] = await db.promise().execute(
                    `SELECT * FROM services WHERE id = ?`, [serviceId]
                );

                if (service.length > 0) {
                    services.push(service[0]); // Push service into services array
                    await db.promise().execute(
                        'INSERT INTO invoice_details (invoice_id, service, price) VALUES (?, ?, ?)',
                        [invoiceResult.insertId, service[0].nom, service[0].price]
                    );
                }
            }

            // Generate PDF for patient
            const patientInvoiceData = {
                rdvId,
                patient: 'Patient Name', // Replace with actual patient data
                provider: { name: provider.name },
                services: services,
                payment: {
                    user: { amount: total },
                },
                invoice_id: invoiceResult.insertId,
            };

            const patientPDFPath = await generateInvoicePDF(patientInvoiceData, 'patient', invoiceResult.insertId);

            // Insert into user payments with PDF path
            await db.promise().execute(
                'INSERT INTO patient_payment (invoice_id, total, pdf_path) VALUES (?, ?, ?)',
                [invoiceResult.insertId, total, patientPDFPath]
            );

            res.json({
                success: true,
                status: 200
            });
        }
    } catch (error) {
        console.error(error);
        res.json({
            success: false,
            errors: error,
            status: 500
        });
    }
};



exports.getall = async (req, res) => {
    const user = req.user;
    const paymentStatus = req.query.payment_status; // Get payment status from query parameters
    const page = parseInt(req.query.page) || 1; // Current page number, default to 1
    const pageSize = parseInt(req.query.pageSize) || 6; // Number of records per page, default to 6
    const offset = (page - 1) * pageSize; // Calculate the offset for the SQL query

    try {
        let query = `
        SELECT 
            i.*, 
            u.fullName AS patient, 
            p.fullName AS provider 
        FROM 
            invoices i
        JOIN 
            rdvs r ON i.rdv_id = r.id
        JOIN 
            users u ON r.userId = u.id
        JOIN 
            providers p ON r.providerId = p.id
        WHERE 
            r.providerId = ?`;
        const queryParams = [user.id];

        // If payment status is provided, add the condition to the query
        if (paymentStatus) {
            query += ' AND payment_status = ?';
            queryParams.push(paymentStatus);
        }
        query += ` LIMIT ${pageSize} OFFSET ${offset}`;
        const [invoices] = await db.promise().execute(query, queryParams);
        const [totalCountResult] = await db.promise().execute(`
            SELECT COUNT(*) AS totalCount 
            FROM invoices i
            JOIN rdvs r ON i.rdv_id = r.id
            WHERE r.providerId = ?
            ${paymentStatus ? ' AND i.payment_status = ?' : ''}`,
            paymentStatus ? [user.id, paymentStatus] : [user.id]
        );
        const totalCount = totalCountResult[0].totalCount; // Get the total count
        res.json({
            success: true,
            data: invoices,
            meta: {
                totalRecords: totalCount,
                currentPage: page,
                pageSize: pageSize,
                totalPages: Math.ceil(totalCount / pageSize) // Calculate total pages
            },
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

exports.getInvoiceById = async (req, res) => {
    const id = req.params.id; // Get the invoice ID from the request parameters

    try {
        // Fetch the invoice along with patient, provider, and service details
        const [invoice] = await db.promise().execute(
            `SELECT 
                i.id AS invoice_id, 
                i.total_price, 
                u.fullName AS patient, 
                p.fullName AS provider, 
                p.logo AS provider_logo, 
                details.service AS service_name, 
                details.price AS service_price,
                pp.total AS partner_paid_price,
                up.total AS user_paid_price,
                pp.pdf_path AS partner_pdf_path,
                up.pdf_path AS user_pdf_path
            FROM 
                invoices i
            LEFT JOIN 
                invoice_details details ON i.id = details.invoice_id
            LEFT JOIN 
                rdvs r ON i.rdv_id = r.id
            LEFT JOIN 
                users u ON r.userId = u.id
            LEFT JOIN 
                providers p ON r.providerId = p.id
            LEFT JOIN 
                partner_payment pp ON i.id = pp.invoice_id
            LEFT JOIN 
                patient_payment up ON i.id = up.invoice_id
            WHERE 
                i.id = ? `, 
            [id]
        );

        if (invoice.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found',
                status: 404
            });
        }

        // Create an array of service objects from the query result
        const services = invoice.map(inv => ({
            service_name: inv.service_name,
            service_price: inv.service_price
        }));

        // Fetch the partner's share and the user's share
        const partnerPaid = invoice[0].partner_paid_price;
        const userPaid = invoice[0].user_paid_price;

        // Structure the response for the patient and partner
        const invoiceData = {
            invoice_id: invoice[0].invoice_id,
            total_price: invoice[0].total_price,
            patient: invoice[0].patient,
            provider: {
                name: invoice[0].provider,
                logo: invoice[0].provider_logo
            },
            services,
            payment: {
                user: {
                    amount: userPaid || 0,
                    label: 'User Payment',
                    description: 'Amount paid by the user',
                    path: invoice[0].user_pdf_path
                },
                partner: {
                    amount: partnerPaid || 0,
                    label: 'Partner Payment',
                    description: 'Amount paid by the partner',
                    path: invoice[0].partner_pdf_path
                }
            }
        };

        res.json({
            success: true,
            data: invoiceData,
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

// const generateInvoicePDF = async (invoiceData, recipient, id) => {
//     const templatePath = path.join(__dirname, 'invoiceTemplate.ejs');

//     // Update invoice data based on recipient
//     const invoiceForRecipient = {
//         ...invoiceData,
//         to: recipient === 'patient' ? invoiceData.patient : 'Partner',
//         provider_name: invoiceData.provider.name,
//         invoiceId: invoiceData.invoice_id,
//         services: invoiceData.services,
//         total: recipient === 'patient' ? invoiceData.payment.user.amount : invoiceData.payment.partner.amount
//     };

//     // Render the EJS template with dynamic data
//     const htmlContent = await ejs.renderFile(templatePath, invoiceForRecipient);

//     // Generate PDF using Puppeteer
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();
//     await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

//     // Define the output path for the PDF
//     const outputDir = path.join(__dirname, '../assets/invoices'); // Change this to your desired directory
//     if (!fs.existsSync(outputDir)) {
//         fs.mkdirSync(outputDir); // Create the directory if it doesn't exist
//     }

//     const pdfFilePath = path.join(outputDir, `invoice-${recipient}-${id}.pdf`);

//     // Generate the PDF and save it to the specified path
//     await page.pdf({
//         path: pdfFilePath, // Save the PDF to the specified path
//         format: 'A4',
//         printBackground: true
//     });

//     await browser.close();

//     return pdfFilePath; // Return the path to the saved PDF
// };


const generateInvoicePDF = async (invoiceData, recipient, id) => {
    try {
        const outputDir = path.join(__dirname, '../assets/invoices'); // Ensure directory is correct
        console.log('Output Directory:', outputDir);

        // Check if the directory exists, if not create it
        if (!fs.existsSync(outputDir)) {
            console.log('Directory does not exist. Creating...');
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const pdfFilePath = path.join(outputDir, `invoice-${recipient}-${id}.pdf`);
        console.log('PDF File Path:', pdfFilePath);

        // Create a new PDF document
        const doc = new PDFDocument({ size: 'A4', margin: 50 });

        // Create a write stream to save the PDF file
        const writeStream = fs.createWriteStream(pdfFilePath);
        doc.pipe(writeStream);

        // Add content to the PDF
        doc
            .fontSize(20)
            .text('Invoice', { align: 'center' });

        doc.moveDown();
        doc
            .fontSize(12)
            .text(`Invoice ID: ${invoiceData.invoice_id}`, { align: 'left' })
            .text(`Recipient: ${recipient === 'patient' ? invoiceData.patient : 'Partner'}`, { align: 'left' })
            .text(`Provider: ${invoiceData.provider.name}`, { align: 'left' });

        doc.moveDown();

        // Add services section
        doc.fontSize(14).text('Services:');
        invoiceData.services.forEach(service => {
            doc
                .fontSize(12)
                .text(`- ${service.nom}: $${service.price}`);
        });

        doc.moveDown();

        // Add total amount section
        const totalAmount = recipient === 'patient' ? invoiceData.payment.user.amount : invoiceData.payment.partner.amount;
        doc
            .fontSize(14)
            .text(`Total Amount: $${totalAmount}`, { align: 'right' });

        // End and finalize the document
        doc.end();

        // Return a promise that resolves when the PDF is fully written
        return new Promise((resolve, reject) => {
            writeStream.on('finish', () => {
                console.log('PDF generation complete:', pdfFilePath);
                resolve(pdfFilePath); // Return the path to the saved PDF
            });
            writeStream.on('error', (err) => {
                console.error('Error writing PDF:', err);
                reject(err); // Handle any file writing errors
            });
        });
    } catch (error) {
        console.error('Error in generateInvoicePDF:', error);
        throw error; // Re-throw the error for further handling
    }
};
