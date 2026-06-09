const mongoose = require('mongoose');
const User = require('../models/User');
const SalaryHistory = require('../models/SalaryHistory');
const Attendance = require('../models/Attendance');

const normalizeRole = (role) => {
  const value = String(role || '').trim().toLowerCase();
  const plainValue = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (!plainValue) return 'student';
  if (plainValue.includes('admin') || plainValue.includes('quan tri')) return 'admin';
  if (plainValue.includes('instructor') || plainValue.includes('giang') || plainValue.includes('giao')) return 'instructor';
  if (plainValue.includes('student') || plainValue.includes('sinh') || plainValue.includes('hoc')) return 'student';

  return 'student';
};

const normalizePassword = (password) => (
  password === undefined || password === null || password === '' ? '123456' : String(password)
);

exports.createUser = async (req, res) => {
  try {
    const { username, name, email, phone, major, role, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email này đã tồn tại trên hệ thống!' });
    }

    const newUser = new User({
      username,
      name,
      email,
      phone,
      major,
      role: normalizeRole(role),
      password: normalizePassword(password),
    });

    await newUser.save();
    res.status(201).json({ message: 'Thêm người dùng thành công!', user: newUser });
  } catch (error) {
    res.status(500).json({ message: `Lỗi thêm người dùng: ${error.message}` });
  }
};

exports.importUsers = async (req, res) => {
  try {
    const { users } = req.body;

    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: 'Danh sách dữ liệu Excel trống!' });
    }

    const preparedUsers = users
      .filter((u) => u && u.email)
      .map((u) => ({
        username: u.username || u.email.split('@')[0],
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        major: u.major || '',
        role: normalizeRole(u.role),
        password: normalizePassword(u.password),
      }));

    if (preparedUsers.length === 0) {
      return res.status(400).json({ message: 'Không có email hợp lệ để import.' });
    }

    await User.insertMany(preparedUsers);
    res.status(200).json({ message: `Nạp thành công ${preparedUsers.length} người dùng từ file Excel!` });
  } catch (error) {
    res.status(500).json({ message: `Lỗi nạp file Excel: ${error.message}` });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { userId, name, oldPassword, newPassword } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Mã tài khoản không hợp lệ!' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });

    if (name) user.name = name;

    if (newPassword) {
      if (!oldPassword) {
        return res.status(400).json({ message: 'Vui lòng nhập mật khẩu hiện tại!' });
      }

      const isMatch = String(oldPassword ?? '') === String(user.password ?? '');
      if (!isMatch) {
        return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác!' });
      }

      user.password = normalizePassword(newPassword);
    }

    await user.save();

    res.status(200).json({
      message: 'Cập nhật tài khoản thành công!',
      user: {
        id: user._id,
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: normalizeRole(user.role),
      },
    });
  } catch (error) {
    console.error('Lỗi Backend:', error);
    res.status(500).json({ message: `Lỗi Backend: ${error.message}` });
  }
};

exports.getInstructorSalaryHistory = async (req, res) => {
  try {
    const { instructorId } = req.params;

    if (!instructorId || instructorId === 'undefined' || !mongoose.Types.ObjectId.isValid(instructorId)) {
      return res.status(200).json([]);
    }

    const UserModel = mongoose.models.User || mongoose.models.user || require('../models/User');
    const instructorUser = await UserModel.findById(instructorId);

    if (instructorUser) {
      const cleanName = instructorUser.name.replace(/(ThS\.|TS\.|Thạc sĩ|Tiến sĩ)\s*/i, '').trim();

      const allAttendances = await Attendance.find({
        instructor: { $regex: new RegExp(cleanName, 'i') },
      });

      const uniqueSessions = {};
      allAttendances.forEach((att) => {
        const key = `${att.classId}_${att.date}`;
        if (!uniqueSessions[key]) {
          uniqueSessions[key] = { classId: att.classId, date: att.date };
        }
      });

      const sessionList = Object.values(uniqueSessions);

      for (const session of sessionList) {
        if (session.classId && mongoose.Types.ObjectId.isValid(session.classId)) {
          const isSalaryExist = await SalaryHistory.findOne({
            instructorId,
            classId: session.classId,
            date: session.date,
          });

          if (!isSalaryExist) {
            const standardDuration = 120;
            const standardSalary = 400000;
            const mockTime = new Date();

            await SalaryHistory.create({
              instructorId,
              classId: session.classId,
              date: session.date,
              startTime: mockTime,
              endTime: new Date(mockTime.getTime() + standardDuration * 60000),
              duration: standardDuration,
              salaryEarned: standardSalary,
            });
          }
        }
      }
    }

    const history = await SalaryHistory.find({ instructorId })
      .populate('classId')
      .sort({ createdAt: -1 });

    res.status(200).json(history);
  } catch (error) {
    console.error('Lỗi lấy lịch sử lương:', error);
    res.status(500).json({ message: `Lỗi Backend: ${error.message}` });
  }
};
