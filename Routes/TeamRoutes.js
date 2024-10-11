const express = require('express');
const routes = express.Router();
const {create, deleteTeam} = require('../Controllers/TeamController');

routes.post('/', create);

routes.delete('/:id',  deleteTeam);


module.exports = routes