const express = require('express');
const routes = express.Router();
const {add, getAll, deleteAdmin, Login} = require('../Controllers/SuperAdminsController');
const isAuth = require('../Midlewares/AuthMidleware');


routes.post('/login', Login);

routes.get('/', isAuth, getAll);

routes.post('/', isAuth,add);

routes.delete('/:id', isAuth,  deleteAdmin);


module.exports = routes