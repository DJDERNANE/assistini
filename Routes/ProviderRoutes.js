const express = require('express');
const router = express.Router();
const isAuth = require('../Midlewares/AuthMidleware')
const {changeEmail, setInformations, getInformations, updateInformations, SignUp, Login, allProviders, showProvider, updateProvider, searchProvider, confirmOtpCode, me, deleteLogo, changePassword, blockProvider, activateProvider, providerSpecialties} = require('../Controllers/ProviderController');

router.get('/', isAuth, allProviders);
router.get('/me',isAuth,  me);
router.get('/info',isAuth,  getInformations);
router.post('/info',isAuth,  setInformations);
router.put('/info',isAuth,  updateInformations);
router.get('/provider/:id',  showProvider);
router.put('/provider',isAuth,   updateProvider);
router.put('/deleteLogo',isAuth, deleteLogo);
router.post('/login', Login);
router.post('/register', SignUp);
router.get('/providersearch', searchProvider);
router.post('/confirmOtpCode',confirmOtpCode);
router.post('/changeemail', isAuth, changeEmail);
router.post('/changepassword', isAuth, changePassword);
router.get('/specialties/:id', isAuth, providerSpecialties);

router.put('/block/:id',  blockProvider);
router.put('/activate/:id',  activateProvider);

module.exports = router