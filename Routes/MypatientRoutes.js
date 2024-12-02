const  {create , getAll, getPersonById, deletePerson} = require('../Controllers/MyPatientsController')
const isAuth = require('../Midlewares/AuthMidleware')
const express = require('express'); 
const router = express.Router();

router.get('/', isAuth, getAll);

router.post('/', isAuth, create);

router.get('/:id', isAuth, getPersonById);

router.delete('/:id', isAuth, deletePerson);

module.exports = router