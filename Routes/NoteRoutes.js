

const express = require('express');
const router = express.Router();
const {addNote, getNotesSended,getNotesRecieved, addTeamNote} = require('../Controllers/NotesController');

router.post('/', addNote);
router.post('/team', addTeamNote);
router.get('/', getNotesSended);
router.get('/recieved', getNotesRecieved);


module.exports = router