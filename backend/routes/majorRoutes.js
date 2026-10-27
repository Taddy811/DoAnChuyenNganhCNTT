const express = require('express');
const router = express.Router();
const { getMajors, getDeletedMajors, createMajor, updateMajor, deleteMajor, restoreMajor } = require('../controllers/majorController');

router.get('/', getMajors);
router.get('/deleted', getDeletedMajors);
router.post('/', createMajor);
router.put('/:id/restore', restoreMajor);
router.put('/:id', updateMajor);
router.delete('/:id', deleteMajor);

module.exports = router;
