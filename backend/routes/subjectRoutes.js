const express = require('express');
const router = express.Router();
const { getSubjects, getDeletedSubjects, createSubject, updateSubject, deleteSubject, restoreSubject } = require('../controllers/subjectController');

router.get('/', getSubjects);
router.get('/deleted', getDeletedSubjects);
router.post('/', createSubject);
router.put('/:id/restore', restoreSubject);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);

module.exports = router;
