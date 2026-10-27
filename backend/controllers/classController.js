const Class = require('../models/Class');
const { activeFilter, deletedFilter, buildSoftDeletePayload, restorePayload } = require('../utils/softDelete');

const getClasses = async (req, res) => {
  try {
    const classes = await Class.find(activeFilter).sort({ createdAt: -1 });
    res.status(200).json(classes);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const getDeletedClasses = async (req, res) => {
  try {
    const classes = await Class.find(deletedFilter)
      .populate('deletedBy', 'name username email')
      .sort({ deletedAt: -1, updatedAt: -1 });
    res.status(200).json(classes);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const createClass = async (req, res) => {
  try {
    const existing = await Class.findOne({ name: req.body.name });
    if (existing) return res.status(400).json({ message: 'Tên lớp học đã tồn tại!' });
    const newClass = await Class.create(req.body);
    res.status(201).json(newClass);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const updateClass = async (req, res) => {
  try {
    const updatedClass = await Class.findOneAndUpdate({ _id: req.params.id, ...activeFilter }, req.body, { new: true });
    if (!updatedClass) return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    res.status(200).json(updatedClass);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const deleteClass = async (req, res) => {
  try {
    const hiddenClass = await Class.findByIdAndUpdate(req.params.id, buildSoftDeletePayload(req), { new: true });
    if (!hiddenClass) return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    res.status(200).json({ message: 'Đã ẩn dữ liệu thành công.', class: hiddenClass });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const restoreClass = async (req, res) => {
  try {
    const restoredClass = await Class.findByIdAndUpdate(req.params.id, restorePayload, { new: true });
    if (!restoredClass) return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    res.status(200).json({ message: 'Khôi phục lớp học thành công.', class: restoredClass });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

module.exports = { getClasses, getDeletedClasses, createClass, updateClass, deleteClass, restoreClass };
