const express = require('express');
const routes = express.Router();
const {CreateSpecialty, allSpecialties, deleteSpecialty, UpdateSpecialty, searchSpecialty, specialtiesOfCat} = require('../Controllers/SpecialtyController');

routes.get('/', allSpecialties);

routes.get('/query', searchSpecialty);

routes.get('/specialtiesofcategory', specialtiesOfCat);

routes.post('/', CreateSpecialty);

routes.delete('/:id', deleteSpecialty);

routes.put('/:id', UpdateSpecialty);


module.exports = routes