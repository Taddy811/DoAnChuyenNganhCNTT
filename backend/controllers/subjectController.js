const Subject = require('../models/Subject');
const { activeFilter, deletedFilter, buildSoftDeletePayload, restorePayload } = require('../utils/softDelete');

const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find(activeFilter).sort({ createdAt: -1 });
    res.status(200).json(subjects);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const getDeletedSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find(deletedFilter)
      .populate('deletedBy', 'name username email')
      .sort({ deletedAt: -1, updatedAt: -1 });
    res.status(200).json(subjects);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const createSubject = async (req, res) => {
  try {
    const { code, name, description, status } = req.body; // Đã xóa englishName
    const existing = await Subject.findOne({ code });
    if (existing) return res.status(400).json({ message: 'Mã môn học đã tồn tại!' });
    
    const subject = await Subject.create({ code, name, description, status }); // Đã xóa englishName
    res.status(201).json(subject);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findOneAndUpdate({ _id: req.params.id, ...activeFilter }, req.body, { new: true });
    if (!subject) return res.status(404).json({ message: 'Không tìm thấy môn học' });
    res.status(200).json(subject);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, buildSoftDeletePayload(req), { new: true });
    if (!subject) return res.status(404).json({ message: 'Không tìm thấy môn học' });
    res.status(200).json({ message: 'Đã ẩn dữ liệu thành công.', subject });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const restoreSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, restorePayload, { new: true });
    if (!subject) return res.status(404).json({ message: 'Không tìm thấy môn học' });
    res.status(200).json({ message: 'Khôi phục môn học thành công.', subject });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

module.exports = { getSubjects, getDeletedSubjects, createSubject, updateSubject, deleteSubject, restoreSubject };
