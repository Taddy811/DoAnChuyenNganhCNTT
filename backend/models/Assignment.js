const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    originalName: { type: String },
    fileName: { type: String },
    url: { type: String },
    mimeType: { type: String },
    size: { type: Number },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    studentName: { type: String, required: true },
    studentUsername: { type: String },
    file: fileSchema,
    privateComment: { type: String },
    status: { type: String, enum: ['submitted', 'unsubmitted', 'deleted'], default: 'submitted' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    submittedAt: { type: Date, default: Date.now },
    grade: { type: Number },
    feedback: { type: String },
    gradedAt: { type: Date },
  },
  { timestamps: true }
);

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    classId: { type: String, required: true },
    className: { type: String, required: true },
    subject: { type: String },
    instructorId: { type: String },
    instructorName: { type: String, required: true },
    dueAt: { type: Date, required: true },
    maxScore: { type: Number, default: 10 },
    attachment: fileSchema,
    status: { type: String, enum: ['open', 'closed', 'deleted'], default: 'open' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    submissions: [submissionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
