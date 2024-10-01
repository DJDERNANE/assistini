

const express = require('express');
const router = express.Router();
const {addNote, getNotesSended,getNotesRecieved, addTeamNote, getTeamNotes} = require('../Controllers/NotesController');

router.post('/', addNote);
// router.post('/to_admin', addNoteToAdmin);
router.post('/team', addTeamNote);
router.get('/team', getTeamNotes);
router.get('/', getNotesSended);
router.get('/recieved', getNotesRecieved);


module.exports = router