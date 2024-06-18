const express = require('express');
const routes = express.Router();
const {add, getAll, deleteSubAdmin} = require('../Controllers/SubAdminsController');

routes.get('/', getAll);

routes.post('/', add);

routes.delete('/:id',  deleteSubAdmin);


module.exports = routes