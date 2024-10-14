const express = require('express');
const router = express.Router();
const {create, getall, getRapportById, getRapportByInvoiceId} = require('../Controllers/RapportsController');


router.post('/',create);
router.get('/',getall);
router.get('/:id',getRapportById);
router.get('/invoice/:id',getRapportByInvoiceId);

module.exports = router