const express = require('express');
const router = express.Router();
const {CreateRdv,allRdvs, confirmRdv, cancelRdv, deleteRdv, closeRdv, patientAllRdvs, allConfirmedRdvs} = require('../Controllers/RdvController');

router.get('/', allRdvs);
router.get('/waitinglist', allConfirmedRdvs);
router.get('/patient', patientAllRdvs);
router.post('/user/:userId/provider/:providerId', CreateRdv);
router.put('/confirm/:id', confirmRdv);
router.put('/cancel/:id', cancelRdv);
router.put('/close/:id', closeRdv);
router.delete('/:id', deleteRdv);



module.exports = router