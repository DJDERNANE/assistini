const express = require('express');
const routes = express.Router();
const {add, getAll} = require('../Controllers/PartnerController');
const isAuth = require('../Midlewares/AuthMidleware');


routes.get('/', isAuth, getAll);

routes.post('/', isAuth,add);


module.exports = routes