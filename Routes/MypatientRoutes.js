const  {create , getAll, getPersonById, deletePerson} = require('../Controllers/MyPatientsController')

const express = require('express'); 
const router = express.Router();

router.get('/', getAll);

router.post('/', create);

router.get('/:id', getPersonById);

router.delete('/:id', deletePerson);

module.exports = router