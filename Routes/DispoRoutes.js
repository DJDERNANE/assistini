const express = require('express');
const router = express.Router();
const {ProviderDisponibilities} = require('../Controllers/DisponibilitiesController');



router.get('/provider/:id',ProviderDisponibilities);

module.exports = router
