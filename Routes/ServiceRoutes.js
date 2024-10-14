const express = require('express');
const router = express.Router();
const {createService, allServices, specialtyServices, deleteService} = require('../Controllers/ServicesController');

router.get('/', allServices);
router.delete('/:id', deleteService);
router.get('/:spcId', specialtyServices);
router.post('/', createService);





module.exports = router