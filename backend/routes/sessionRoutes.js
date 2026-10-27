const express = require('express');
const router = express.Router();
const { getSessions, getDeletedSessions, createSession, updateSession, deleteSession, restoreSession } = require('../controllers/sessionController');

router.get('/', getSessions);
router.get('/deleted', getDeletedSessions);
router.post('/', createSession);
router.put('/:id/restore', restoreSession);
router.put('/:id', updateSession);
router.delete('/:id', deleteSession);

module.exports = router;
