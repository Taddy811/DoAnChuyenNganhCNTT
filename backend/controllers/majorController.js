const Major = require('../models/Major');
const { activeFilter, deletedFilter, buildSoftDeletePayload, restorePayload } = require('../utils/softDelete');

const getMajors = async (req, res) => {
  try {
    const majors = await Major.find(activeFilter).sort({ createdAt: -1 });
    res.status(200).json(majors);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const getDeletedMajors = async (req, res) => {
  try {
    const majors = await Major.find(deletedFilter)
      .populate('deletedBy', 'name username email')
      .sort({ deletedAt: -1, updatedAt: -1 });
    res.status(200).json(majors);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const createMajor = async (req, res) => {
  try {
    const { code, name, description, status } = req.body;
    const existing = await Major.findOne({ code });
    if (existing) return res.status(400).json({ message: 'Mã chuyên ngành đã tồn tại!' });
    const major = await Major.create({ code, name, description, status });
    res.status(201).json(major);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const updateMajor = async (req, res) => {
  try {
    const major = await Major.findOneAndUpdate({ _id: req.params.id, ...activeFilter }, req.body, { new: true });
    if (!major) return res.status(404).json({ message: 'Không tìm thấy chuyên ngành' });
    res.status(200).json(major);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const deleteMajor = async (req, res) => {
  try {
    const major = await Major.findByIdAndUpdate(req.params.id, buildSoftDeletePayload(req), { new: true });
    if (!major) return res.status(404).json({ message: 'Không tìm thấy chuyên ngành' });
    res.status(200).json({ message: 'Đã ẩn dữ liệu thành công.', major });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const restoreMajor = async (req, res) => {
  try {
    const major = await Major.findByIdAndUpdate(req.params.id, restorePayload, { new: true });
    if (!major) return res.status(404).json({ message: 'Không tìm thấy chuyên ngành' });
    res.status(200).json({ message: 'Khôi phục chuyên ngành thành công.', major });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

module.exports = { getMajors, getDeletedMajors, createMajor, updateMajor, deleteMajor, restoreMajor };
