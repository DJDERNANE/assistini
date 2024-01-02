const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {accountActivation} = require('../Controllers/ActiveUserAccountController')

router.get('/api/verify/:token', accountActivation);

module.exports = router; // Fix the typo here
