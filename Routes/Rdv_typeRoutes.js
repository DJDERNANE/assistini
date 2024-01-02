const express = require('express');
const routes = express.Router();
const {CreateType, allTypes, deleteType, UpdateType} = require('../Controllers/RdvTypeController');

routes.get('/', allTypes);

routes.post('/', CreateType);

routes.delete('/:id', deleteType);

routes.put('/:id', UpdateType);


module.exports = routes