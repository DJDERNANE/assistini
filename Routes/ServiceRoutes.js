const express = require('express');
const router = express.Router();
const {createService, allServices} = require('../Controllers/ServicesController');

router.get('/:spcId', allServices);
router.post('/', createService);





module.exports = router