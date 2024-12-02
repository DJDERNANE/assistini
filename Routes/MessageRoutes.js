const express = require('express');
const router = express.Router();
const { messages, getAllMyMessages, sendMessage} = require('../Controllers/MessageController');
const isAuth = require('../Midlewares/AuthMidleware');


router.get('/con/:recipient_id', isAuth,messages);
router.get('/:role',isAuth,getAllMyMessages);
router.post('/:role',isAuth, sendMessage);

module.exports = router