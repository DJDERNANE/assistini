const express = require('express');
const router = express.Router();
const isAuth = require('../Midlewares/AuthMidleware')
const {SignUp, Login, allUsers,showUser, updateUser,checkEmail,ResetPassword, confirmEmail, confirmOtpCode,me} = require('../Controllers/UserController');


router.get('/me',isAuth,me);
 router.post('/register',SignUp);
 router.post('/login',Login);
 router.put('/:id', updateUser);
router.get('/', allUsers);
router.get('/user/:id', showUser);
 router.post('/checkEmail',checkEmail);
 router.post('/confrimEmail',confirmEmail);
 router.post('/ResetPassword',ResetPassword);
 router.post('/confirmOtpCode',confirmOtpCode);
module.exports  = router;