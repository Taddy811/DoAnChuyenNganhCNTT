const express = require('express');
const router = express.Router();
const { getClasses, getDeletedClasses, createClass, updateClass, deleteClass, restoreClass } = require('../controllers/classController');

router.get('/', getClasses);
router.get('/deleted', getDeletedClasses);
router.post('/', createClass);
router.put('/:id/restore', restoreClass);
router.put('/:id', updateClass);
router.delete('/:id', deleteClass);

module.exports = router;
