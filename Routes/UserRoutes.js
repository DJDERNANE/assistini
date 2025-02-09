const express = require('express');
const router = express.Router();
const isAuth = require('../Midlewares/AuthMidleware')
const {SignUp, Login, allUsers,showUser, updateUser,checkEmail,ResetPassword, confirmEmail, confirmOtpCode,me, blockUser, activateuser,
    toggleFavorite, listFavorites, getUserPartners
} = require('../Controllers/UserController');


router.get('/me',isAuth,me);
 router.post('/register',SignUp);
 router.post('/login',Login);
 router.put('/',isAuth, updateUser);
router.get('/', allUsers);
router.get('/user/:id', showUser);
 router.post('/checkEmail',checkEmail);
 router.post('/confrimEmail',confirmEmail);
 router.post('/ResetPassword',ResetPassword);
 router.post('/confirmOtpCode',confirmOtpCode);
 router.put('/block/:id',  blockUser);
router.put('/activate/:id',  activateuser);
router.post('/togglefav',isAuth,  toggleFavorite);
router.get('/fav',isAuth,  listFavorites);
router.get('/partners/:userId',  getUserPartners);
module.exports  = router;