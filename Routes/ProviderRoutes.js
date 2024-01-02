const express = require('express');
const router = express.Router();
const {SignUp, Login, allProviders, showProvider, updateProvider, searchProvider} = require('../Controllers/ProviderController');

router.get('/',  allProviders);
router.get('/provider/:id',  showProvider);
router.put('/provider/:id',  updateProvider);
router.post('/login', Login);
router.post('/register', SignUp);
router.get('/providersearch', searchProvider);


module.exports = router