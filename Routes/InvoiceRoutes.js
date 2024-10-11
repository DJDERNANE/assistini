const express = require('express');
const router = express.Router();
const {create, getall, getInvoiceById} = require('../Controllers/InvoiceController');



router.post('/',create);
router.get('/',getall);
router.get('/:id',getInvoiceById);
module.exports = router
