const express = require('express');
const router = express.Router();
const {CreateRdv,allRdvs, confirmRdv, RefuseAccessFilesRequest, AccepetAccessFilesRequest,cancelRdv, deleteRdv, closeRdv, patientAllRdvs, allConfirmedRdvs, pricing, checkRdvForToday, reprogramerRdv, SignUpAndCreateRdv, AccessFilesRequest, allAccessFilesRequest} = require('../Controllers/RdvController');
const isAuth = require('../Midlewares/AuthMidleware');

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
router.post('/accessfiles', isAuth, AccessFilesRequest);
router.get('/accessfiles', isAuth, allAccessFilesRequest);
router.put('/accessfiles/accept/:id', isAuth, AccepetAccessFilesRequest);
router.put('/accessfiles/refuse/:rdvId', isAuth, RefuseAccessFilesRequest);
module.exports = router