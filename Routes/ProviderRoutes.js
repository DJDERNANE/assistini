const express = require('express');
const router = express.Router();
const isAuth = require('../Midlewares/AuthMidleware')
const {changeEmail, SignUp, Login, allProviders, showProvider, updateProvider, searchProvider, confirmOtpCode, me, deleteLogo, changePassword, blockProvider, activateProvider, providerSpecialties} = require('../Controllers/ProviderController');

router.get('/',  allProviders);
router.get('/me',isAuth,  me);
router.get('/provider/:id',  showProvider);
router.put('/provider',isAuth,   updateProvider);
router.put('/deleteLogo',isAuth, deleteLogo);
router.post('/login', Login);
router.post('/register', SignUp);
router.get('/providersearch', searchProvider);
router.post('/confirmOtpCode',confirmOtpCode);
router.post('/changeemail', isAuth, changeEmail);
router.post('/changepassword', isAuth, changePassword);
router.get('/specialties', isAuth, providerSpecialties);

router.put('/block/:id',  blockProvider);
router.put('/activate/:id',  activateProvider);

module.exports = router