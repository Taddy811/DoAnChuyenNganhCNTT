const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const assignmentController = require('../controllers/assignmentController');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', 'uploads', 'assignments');

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const safeBase = path
      .basename(file.originalname || 'file', ext)
      .replace(/[^\w.-]+/g, '_')
      .slice(0, 80);

    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.get('/', assignmentController.getAssignments);
router.get('/:id', assignmentController.getAssignmentById);
router.post('/', upload.single('attachment'), assignmentController.createAssignment);
router.put('/:id', upload.single('attachment'), assignmentController.updateAssignment);
router.delete('/:id', assignmentController.deleteAssignment);
router.post('/:id/submit', upload.single('submissionFile'), assignmentController.submitAssignment);
router.post('/:id/unsubmit', assignmentController.unsubmitAssignment);
router.put('/:id/submissions/:submissionId/grade', assignmentController.gradeSubmission);

module.exports = router;
