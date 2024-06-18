

const express = require('express');
const router = express.Router();
const {addNote, getNotesSended,getNotesRecieved} = require('../Controllers/NotesController');

router.post('/', addNote);
router.get('/', getNotesSended);
router.get('/recieved', getNotesRecieved);


module.exports = router