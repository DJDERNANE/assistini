const express = require('express');
const router = express.Router();
const {createService, allServices, specialtyServices} = require('../Controllers/ServicesController');

router.get('/', allServices);
router.get('/:spcId', specialtyServices);
router.post('/', createService);





module.exports = router