const express = require('express');
const router = express.Router();
const {ProviderDisponibilties} = require('../Controllers/DisponibilitiesController');



router.get('/provider/:id',ProviderDisponibilties);

module.exports = router
