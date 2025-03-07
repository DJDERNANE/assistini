const express = require('express');
const router = express.Router();
const {create, getall, getInvoiceById, toggleFavorite, getFav, updatePaymentStatus, payInvoice, patientInvoices} = require('../Controllers/InvoiceController');



router.post('/',create);
router.get('/',getall);
router.get('/patient',patientInvoices);
router.post('/pay/:id',payInvoice);
router.get('/favs',getFav);
router.post('/update/:invoiceId',updatePaymentStatus);
router.post('/:invoiceId',toggleFavorite);
router.get('/:id',getInvoiceById);


module.exports = router
