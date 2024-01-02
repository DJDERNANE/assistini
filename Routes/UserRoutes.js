const express = require('express');
const router = express.Router();
const {SignUp, Login, allUsers,showUser, updateUser,checkEmail,ResetPassword, confrimEmail} = require('../Controllers/UserController');
//const {isAuth} = require('../Midlewares/AuthMidleware');


router.post('/register',SignUp);
router.post('/login',Login);
router.put('/:id', updateUser);
router.get('/', allUsers);
router.get('/user/:id', showUser);
router.post('/checkEmail',checkEmail);
router.post('/confrimEmail',confrimEmail);
router.post('/ResetPassword',ResetPassword);
module.exports  = router;