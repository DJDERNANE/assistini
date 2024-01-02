const express = require('express');
const router = express.Router();
const {accountActivation} = require('../Controllers/ActiveProviderAccountController')

router.get('/api/verify/:token', accountActivation);

module.exports = router; // Fix the typo here
