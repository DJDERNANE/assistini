const express = require('express');
const routes = express.Router();
const {add, getAll, deleteSubAdmin, Login,me} = require('../Controllers/SubAdminsController');
const isAuth = require('../Midlewares/AuthMidleware');


routes.post('/login', Login);

routes.get('/me', isAuth,me);

routes.get('/', isAuth, getAll);

routes.post('/', isAuth, add);

routes.delete('/:id', isAuth,  deleteSubAdmin);


module.exports = routes