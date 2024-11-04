const express = require('express');
const router = express.Router();
const { messages, getAllMyMessages, sendMessage} = require('../Controllers/MessageController');


router.get('/con/:recipient_id',messages);
router.get('/:role',getAllMyMessages);
router.post('/:role', sendMessage);

module.exports = router