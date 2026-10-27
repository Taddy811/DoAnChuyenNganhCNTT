const fs = require('fs');
const path = require('path');
const Assignment = require('../models/Assignment');
const Class = require('../models/Class');
const User = require('../models/User');
const { activeFilter, deletedFilter, buildSoftDeletePayload, restorePayload } = require('../utils/softDelete');

const uploadRoot = path.join(__dirname, '..', 'uploads', 'assignments');

const normalizeId = (value) => String(value || '').trim();

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isPastDue = (assignment) => {
  if (!assignment?.dueAt) return false;
  return new Date(assignment.dueAt).getTime() < Date.now();
};

const toFilePayload = (file) => {
  if (!file) return undefined;

  return {
    originalName: file.originalname,
    fileName: file.filename,
    url: `/uploads/assignments/${file.filename}`,
    mimeType: file.mimetype,
    size: file.size,
  };
};

const deleteFile = (fileInfo) => {
  if (!fileInfo?.fileName) return;

  const targetPath = path.join(uploadRoot, fileInfo.fileName);
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
  }
};

const buildStudentList = async (assignment) => {
  const cls = await Class.findById(assignment.classId).catch(() => null)
    || await Class.findOne({ name: assignment.className });

  const labels = Array.isArray(cls?.students) ? cls.students : [];
  const users = labels.length
    ? await User.find({
        $or: [
          { name: { $in: labels } },
          { username: { $in: labels } },
        ],
      }).select('name username email isDeleted status')
    : [];

  return labels.map((label) => {
    const user = users.find((item) => item.name === label || item.username === label);
    const isDeleted = Boolean(user?.isDeleted || user?.status === 'deleted');
    return {
      name: `${user?.name || label}${isDeleted ? ' (Đã xóa)' : ''}`,
      username: user?.username || (user?.name !== label ? label : ''),
      email: user?.email || '',
      isDeleted,
    };
  });
};

const serializeAssignment = async (assignment) => {
  const plain = assignment.toObject ? assignment.toObject() : assignment;
  const classStudents = await buildStudentList(plain);
  const activeSubmissions = plain.submissions.filter((submission) => !submission.isDeleted && submission.status === 'submitted');
  const submittedCount = activeSubmissions.length;
  const gradedCount = activeSubmissions.filter((submission) => submission.grade !== undefined && submission.grade !== null).length;

  return {
    ...plain,
    classStudents,
    stats: {
      totalStudents: classStudents.length,
      submittedCount,
      missingCount: Math.max(classStudents.length - submittedCount, 0),
      gradedCount,
    },
  };
};

const serializeMany = async (assignments) => Promise.all(assignments.map(serializeAssignment));

const getAssignments = async (req, res) => {
  try {
    const { instructorName, instructorId, classId, studentName, studentUsername, status } = req.query;
    const filter = { ...activeFilter };

    if (instructorName || instructorId) {
      filter.$or = [];
      if (instructorName) filter.$or.push({ instructorName });
      if (instructorId) filter.$or.push({ instructorId });
    }
    if (classId) filter.classId = classId;
    if (status) filter.status = status;

    if (studentName || studentUsername) {
      const studentKeys = [studentName, studentUsername].filter(Boolean);
      const classes = await Class.find({ students: { $in: studentKeys }, ...activeFilter }).select('_id');
      filter.classId = { $in: classes.map((cls) => cls._id.toString()) };
    }

    const assignments = await Assignment.find(filter).sort({ dueAt: 1, createdAt: -1 });
    res.status(200).json(await serializeMany(assignments));
  } catch (error) {
    res.status(500).json({ message: 'Không thể tải danh sách bài tập.', error: error.message });
  }
};

const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, ...activeFilter });
    if (!assignment) return res.status(404).json({ message: 'Không tìm thấy bài tập.' });

    res.status(200).json(await serializeAssignment(assignment));
  } catch (error) {
    res.status(500).json({ message: 'Không thể tải chi tiết bài tập.', error: error.message });
  }
};

const getDeletedAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find(deletedFilter)
      .populate('deletedBy', 'name username email')
      .sort({ deletedAt: -1, updatedAt: -1 });
    res.status(200).json(await serializeMany(assignments));
  } catch (error) {
    res.status(500).json({ message: 'Không thể tải danh sách bài tập đã ẩn.', error: error.message });
  }
};

const createAssignment = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.body.classId, ...activeFilter });
    if (!cls) return res.status(404).json({ message: 'Không tìm thấy lớp học áp dụng.' });

    const assignment = await Assignment.create({
      title: req.body.title,
      description: req.body.description || '',
      classId: cls._id.toString(),
      className: cls.name,
      subject: req.body.subject || cls.subject,
      instructorId: req.body.instructorId || '',
      instructorName: req.body.instructorName || cls.instructor,
      dueAt: req.body.dueAt,
      maxScore: toNumber(req.body.maxScore, 10),
      attachment: toFilePayload(req.file),
      status: req.body.status === 'closed' ? 'closed' : 'open',
    });

    res.status(201).json({ message: 'Tạo bài tập thành công.', assignment: await serializeAssignment(assignment) });
  } catch (error) {
    res.status(500).json({ message: 'Không thể tạo bài tập.', error: error.message });
  }
};

const updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, ...activeFilter });
    if (!assignment) return res.status(404).json({ message: 'Không tìm thấy bài tập.' });

    let cls = null;
    if (req.body.classId && req.body.classId !== assignment.classId) {
      cls = await Class.findOne({ _id: req.body.classId, ...activeFilter });
      if (!cls) return res.status(404).json({ message: 'Không tìm thấy lớp học áp dụng.' });
    }

    assignment.title = req.body.title ?? assignment.title;
    assignment.description = req.body.description ?? assignment.description;
    assignment.dueAt = req.body.dueAt || assignment.dueAt;
    assignment.maxScore = req.body.maxScore !== undefined ? toNumber(req.body.maxScore, assignment.maxScore) : assignment.maxScore;
    assignment.status = req.body.status === 'closed' ? 'closed' : 'open';
    assignment.subject = req.body.subject || cls?.subject || assignment.subject;

    if (cls) {
      assignment.classId = cls._id.toString();
      assignment.className = cls.name;
    }

    if (req.file) {
      deleteFile(assignment.attachment);
      assignment.attachment = toFilePayload(req.file);
    }

    await assignment.save();
    res.status(200).json({ message: 'Cập nhật bài tập thành công.', assignment: await serializeAssignment(assignment) });
  } catch (error) {
    res.status(500).json({ message: 'Không thể cập nhật bài tập.', error: error.message });
  }
};

const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(req.params.id, buildSoftDeletePayload(req), { new: true });
    if (!assignment) return res.status(404).json({ message: 'Không tìm thấy bài tập.' });

    res.status(200).json({ message: 'Đã ẩn dữ liệu thành công.', assignment: await serializeAssignment(assignment) });
  } catch (error) {
    res.status(500).json({ message: 'Không thể xóa bài tập.', error: error.message });
  }
};

const restoreAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(req.params.id, { ...restorePayload, status: 'open' }, { new: true });
    if (!assignment) return res.status(404).json({ message: 'Không tìm thấy bài tập.' });
    res.status(200).json({ message: 'Khôi phục bài tập thành công.', assignment: await serializeAssignment(assignment) });
  } catch (error) {
    res.status(500).json({ message: 'Không thể khôi phục bài tập.', error: error.message });
  }
};

const submitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, ...activeFilter });
    if (!assignment) return res.status(404).json({ message: 'Không tìm thấy bài tập.' });
    if (assignment.status === 'closed') return res.status(400).json({ message: 'Bài tập đã đóng, không thể nộp bài.' });
    if (isPastDue(assignment)) return res.status(400).json({ message: 'Đã quá hạn nộp bài.' });
    if (!req.file) return res.status(400).json({ message: 'Vui lòng chọn file bài làm trước khi nộp.' });

    const studentName = String(req.body.studentName || '').trim();
    const studentUsername = String(req.body.studentUsername || '').trim();
    if (!studentName) return res.status(400).json({ message: 'Thiếu thông tin sinh viên.' });

    const existing = assignment.submissions.find((submission) => (
      submission.studentName === studentName
      || (studentUsername && submission.studentUsername === studentUsername)
    ));

    if (existing) {
      existing.file = toFilePayload(req.file);
      existing.privateComment = req.body.privateComment || '';
      existing.status = 'submitted';
      existing.isDeleted = false;
      existing.deletedAt = null;
      existing.deletedBy = null;
      existing.submittedAt = new Date();
      existing.grade = undefined;
      existing.feedback = undefined;
      existing.gradedAt = undefined;
    } else {
      assignment.submissions.push({
        studentName,
        studentUsername,
        file: toFilePayload(req.file),
        privateComment: req.body.privateComment || '',
        submittedAt: new Date(),
      });
    }

    await assignment.save();
    res.status(200).json({ message: 'Nộp bài thành công.', assignment: await serializeAssignment(assignment) });
  } catch (error) {
    res.status(500).json({ message: 'Không thể nộp bài.', error: error.message });
  }
};

const unsubmitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, ...activeFilter });
    if (!assignment) return res.status(404).json({ message: 'Không tìm thấy bài tập.' });
    if (assignment.status === 'closed') return res.status(400).json({ message: 'Bài tập đã đóng, không thể hủy nộp.' });
    if (isPastDue(assignment)) return res.status(400).json({ message: 'Đã quá hạn, không thể hủy nộp.' });

    const studentName = String(req.body.studentName || '').trim();
    const studentUsername = String(req.body.studentUsername || '').trim();
    const existing = assignment.submissions.find((submission) => (
      submission.studentName === studentName
      || (studentUsername && submission.studentUsername === studentUsername)
    ));

    if (!existing) return res.status(404).json({ message: 'Bạn chưa nộp bài tập này.' });

    existing.status = 'unsubmitted';
    existing.isDeleted = true;
    existing.deletedAt = new Date();
    existing.deletedBy = req.user?._id || null;
    await assignment.save();

    res.status(200).json({ message: 'Đã hủy nộp bài.', assignment: await serializeAssignment(assignment) });
  } catch (error) {
    res.status(500).json({ message: 'Không thể hủy nộp bài.', error: error.message });
  }
};

const gradeSubmission = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, ...activeFilter });
    if (!assignment) return res.status(404).json({ message: 'Không tìm thấy bài tập.' });

    const submission = assignment.submissions.id(req.params.submissionId);
    if (!submission || submission.isDeleted) return res.status(404).json({ message: 'Không tìm thấy bài nộp của sinh viên.' });

    const grade = toNumber(req.body.grade, 0);
    if (grade < 0 || grade > assignment.maxScore) {
      return res.status(400).json({ message: `Điểm phải nằm trong khoảng 0 - ${assignment.maxScore}.` });
    }

    submission.grade = grade;
    submission.feedback = req.body.feedback || '';
    submission.gradedAt = new Date();
    await assignment.save();

    res.status(200).json({ message: 'Cập nhật điểm thành công.', assignment: await serializeAssignment(assignment) });
  } catch (error) {
    res.status(500).json({ message: 'Không thể chấm điểm bài nộp.', error: error.message });
  }
};

module.exports = {
  getAssignments,
  getAssignmentById,
  getDeletedAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  restoreAssignment,
  submitAssignment,
  unsubmitAssignment,
  gradeSubmission,
};
