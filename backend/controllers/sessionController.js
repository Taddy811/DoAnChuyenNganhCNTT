const Session = require('../models/Session');
const { activeFilter, deletedFilter, buildSoftDeletePayload, restorePayload } = require('../utils/softDelete');

const getSessions = async (req, res) => {
  try {
    // Sắp xếp tăng dần theo thời gian tạo để STT buổi học đi từ 1, 2, 3...
    const sessions = await Session.find({ source: { $ne: 'qr' }, ...activeFilter }).sort({ createdAt: 1 });
    res.status(200).json(sessions);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const getDeletedSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ ...deletedFilter })
      .populate('deletedBy', 'name username email')
      .sort({ deletedAt: -1, updatedAt: -1 });
    res.status(200).json(sessions);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const createSession = async (req, res) => {
  try {
    const session = await Session.create(req.body);
    res.status(201).json(session);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const updateSession = async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate({ _id: req.params.id, ...activeFilter }, req.body, { new: true });
    if (!session) return res.status(404).json({ message: 'Không tìm thấy buổi học' });
    res.status(200).json(session);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const deleteSession = async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(req.params.id, buildSoftDeletePayload(req), { new: true });
    if (!session) return res.status(404).json({ message: 'Không tìm thấy buổi học' });
    res.status(200).json({ message: 'Đã ẩn dữ liệu thành công.', session });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const restoreSession = async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(req.params.id, restorePayload, { new: true });
    if (!session) return res.status(404).json({ message: 'Không tìm thấy buổi học' });
    res.status(200).json({ message: 'Khôi phục buổi học thành công.', session });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

module.exports = { getSessions, getDeletedSessions, createSession, updateSession, deleteSession, restoreSession };
