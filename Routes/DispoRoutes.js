const express = require('express');
const router = express.Router();
const {ProviderDisponibilities, setProviderAvailability, getdays, updateProviderAvailability} = require('../Controllers/DisponibilitiesController');
const isAuth = require('../Midlewares/AuthMidleware');



router.get('/', isAuth, ProviderDisponibilities);

router.post('/', isAuth,setProviderAvailability);

router.post('/update', isAuth,updateProviderAvailability);

// router.get('/days', getdays)

module.exports = router
