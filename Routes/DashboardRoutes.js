const express = require('express');
const router = express.Router();
const {getRdvStatistics} = require('../Controllers/DashboardController');
const isAuth = require('../Midlewares/AuthMidleware');



router.get('/', isAuth, getRdvStatistics);

module.exports = router
