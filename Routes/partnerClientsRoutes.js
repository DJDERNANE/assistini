const express = require('express');
const routes = express.Router();
const {add, test} = require('../Controllers/partnerClientsController');
const isAuth = require('../Midlewares/AuthMidleware');


routes.post('/:partner',test);


module.exports = routes