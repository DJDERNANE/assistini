const express = require('express');
const router = express.Router();
const {create, getall, getInvoiceById, toggleFavorite, getFav} = require('../Controllers/InvoiceController');



router.post('/',create);
router.get('/',getall);
router.get('/favs',getFav);
router.post('/:invoiceId',toggleFavorite);
router.get('/:id',getInvoiceById);
module.exports = router
