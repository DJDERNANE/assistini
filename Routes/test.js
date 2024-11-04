const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Route to generate PDF
router.get('/generatePDF', async function (req, res) {
    try {
        // Read HTML Template
        const templatePath = path.resolve(__dirname, 'template.html');
        let template = fs.readFileSync(templatePath, 'utf8');
        
        // Inject dynamic data (e.g., date)
        const currentDate = new Date().toLocaleString();
        template = template.replace('{{date}}', currentDate);

        // Launch Puppeteer to generate PDF
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(template);
        
        // Generate PDF from the content
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true, // Ensure background colors/styles are rendered
        });

        await browser.close();

        // Send PDF as response
        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length,
            'Content-Disposition': 'attachment; filename="generated.pdf"',
        }).end(pdfBuffer);
    } catch (err) {
        console.error('Error generating PDF:', err);
        res.status(500).send('Error generating PDF');
    }
});

module.exports = router;
