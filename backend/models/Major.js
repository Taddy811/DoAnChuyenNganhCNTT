const mongoose = require('mongoose');

const majorSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // Mã ngành (VD: SE, AI)
  name: { type: String, required: true },               // Tên ngành
  description: { type: String },                        // Mô tả
  status: { type: String, default: 'Hoạt động' },       // Trạng thái
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Major', majorSchema);
