const User = require('../models/User');
const nodemailer = require('nodemailer');

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

const registerUser = async (req, res) => {
  try {
    const { name, username, email, phone, major, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email này đã được sử dụng!' });
    }

    await User.create({
      name,
      username,
      email,
      phone,
      major,
      password: normalizePassword(password),
      role: normalizeRole(role),
    });

    res.status(201).json({ message: 'Đăng ký thành công!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const importUsersBulk = async (req, res) => {
  try {
    const usersData = req.body;

    if (!usersData || !Array.isArray(usersData) || usersData.length === 0) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ.' });
    }

    const bulkOps = usersData
      .filter((user) => user && user.email)
      .map((user) => ({
        updateOne: {
          filter: { email: user.email },
          update: {
            $setOnInsert: {
              name: user.name,
              email: user.email,
              phone: user.phone || '',
              major: user.major || '',
              role: normalizeRole(user.role),
              username: user.username || user.email.split('@')[0],
              password: normalizePassword(user.password),
            },
          },
          upsert: true,
        },
      }));

    if (bulkOps.length === 0) {
      return res.status(400).json({ message: 'Không có email hợp lệ để import.' });
    }

    const result = await User.bulkWrite(bulkOps);

    res.status(201).json({
      message: 'Nhập dữ liệu thành công!',
      insertedCount: result.upsertedCount,
    });
  } catch (error) {
    console.error('Lỗi import:', error);
    res.status(500).json({ error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { loginId, password } = req.body;
    const user = await User.findOne({ $or: [{ email: loginId }, { username: loginId }] });

    if (!user) return res.status(400).json({ message: 'Tài khoản không tồn tại!' });

    const isMatch = String(password ?? '') === String(user.password ?? '');
    if (!isMatch) return res.status(400).json({ message: 'Mật khẩu không chính xác!' });

    res.status(200).json({
      message: 'Đăng nhập thành công!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: normalizeRole(user.role),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    res.status(200).json({ message: 'Đã xoá người dùng thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, username, email, phone, major, role } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, username, email, phone, major, role: normalizeRole(role) },
      { new: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    res.status(200).json({ message: 'Cập nhật thành công!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Email này chưa được đăng ký trong hệ thống!' });
    }

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      return res.status(500).json({ message: 'Máy chủ chưa cấu hình EMAIL_USER hoặc EMAIL_PASS để gửi OTP.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const mailOptions = {
      from: `Hệ thống LMS E-LEARNING <${emailUser}>`,
      to: user.email,
      subject: 'Mã khôi phục mật khẩu - LMS E-LEARNING',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px; margin: auto;">
          <h3 style="color: #5b51d8;">Xin chào ${user.name || user.username},</h3>
          <p>Bạn vừa yêu cầu khôi phục mật khẩu tài khoản hệ thống.</p>
          <p>Mã OTP xác nhận của bạn là:</p>
          <div style="font-size: 32px; font-weight: bold; color: #5b51d8; background: #f0f7ff; padding: 15px; text-align: center; border-radius: 8px; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: red; font-size: 14px;"><i>* Lưu ý: Mã này sẽ hết hạn sau 15 phút. Tuyệt đối không chia sẻ mã này.</i></p>
          <p>Trân trọng,<br>Đội ngũ LMS E-LEARNING xin cảm ơn!</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Mã OTP đã được gửi về email đăng ký của bạn!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn!' });

    user.password = normalizePassword(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Đổi mật khẩu thành công! Hãy đăng nhập lại.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  deleteUser,
  updateUser,
  forgotPassword,
  resetPassword,
  importUsersBulk,
};
