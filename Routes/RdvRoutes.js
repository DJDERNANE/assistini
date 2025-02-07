const express = require('express');
const router = express.Router();
const {CreateRdv,allRdvs, confirmRdv, cancelRdv, deleteRdv, closeRdv, patientAllRdvs, allConfirmedRdvs, pricing, checkRdvForToday, reprogramerRdv, SignUpAndCreateRdv} = require('../Controllers/RdvController');

router.get('/today', checkRdvForToday);
router.get('/waitinglist', allRdvs);
router.get('/patient', patientAllRdvs);
router.post('/user/provider/:providerId', CreateRdv);
router.post('/createandbook', SignUpAndCreateRdv);
router.post('/programer/:id', reprogramerRdv);
router.put('/confirm/:id', confirmRdv);
router.put('/cancel/:id', cancelRdv);
router.put('/close/:id', closeRdv);
router.delete('/:id', deleteRdv);
router.post('/pricing/:id', pricing);



module.exports = router