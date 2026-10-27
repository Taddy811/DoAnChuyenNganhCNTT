"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Link from "next/link";

type Message = {
  type: "success" | "error" | "";
  text: string;
};

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "admin",
  });
  const [message, setMessage] = useState<Message>({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu xác nhận không khớp." });
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: data.message || "Tạo tài khoản thành công." });
        setFormData({
          name: "",
          username: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
          role: "admin",
        });
      } else {
        setMessage({ type: "error", text: data.error ? `Lỗi chi tiết: ${data.error}` : data.message || "Không thể tạo tài khoản." });
      }
    } catch {
      setMessage({ type: "error", text: "Không thể kết nối với backend. Vui lòng kiểm tra máy chủ." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  return (
    <main className="lms-auth-shell">
      <Link href="/" className="lms-auth-home">
        ← Trang chủ
      </Link>

      <section className="lms-auth-card lms-auth-card-wide">
        <aside className="lms-auth-brand">
          <span className="lms-logo-mark">L</span>
          <p className="lms-kicker">Khởi tạo hệ thống</p>
          <h1>Tạo tài khoản quản trị đầu tiên cho LMS.</h1>
          <div className="lms-auth-points">
            <span>Quản lý người dùng</span>
            <span>Tạo lớp, môn học, chuyên ngành</span>
            <span>Theo dõi toàn bộ hoạt động học tập</span>
          </div>
        </aside>

        <div className="lms-auth-form-panel">
          <div className="lms-form-heading">
            <p className="lms-kicker">Đăng ký</p>
            <h2>Tài khoản admin</h2>
            <span>Form này dùng để tạo tài khoản quản trị hệ thống.</span>
          </div>

          {message.text && (
            <div className={`lms-alert ${message.type === "success" ? "lms-alert-success" : "lms-alert-error"}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="lms-form-stack">
            <div className="lms-form-grid">
              <label>
                <span>Họ và tên</span>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  placeholder="Nguyễn Văn A"
                  className="lms-input"
                  onChange={handleChange}
                />
              </label>

              <label>
                <span>Tên đăng nhập</span>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  placeholder="admin01"
                  className="lms-input"
                  onChange={handleChange}
                />
              </label>
            </div>

            <label>
              <span>Email</span>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                placeholder="admin@example.com"
                className="lms-input"
                onChange={handleChange}
              />
            </label>

            <label>
              <span>Số điện thoại</span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                placeholder="0900000000"
                className="lms-input"
                onChange={handleChange}
              />
            </label>

            <div className="lms-form-grid">
              <label>
                <span>Mật khẩu</span>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  className="lms-input"
                  onChange={handleChange}
                />
              </label>

              <label>
                <span>Xác nhận mật khẩu</span>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  className="lms-input"
                  onChange={handleChange}
                />
              </label>
            </div>

            <label>
              <span>Vai trò</span>
              <select name="role" value={formData.role} onChange={handleChange} className="lms-input">
                <option value="admin">Tài khoản quản trị</option>
              </select>
            </label>

            <button type="submit" disabled={isLoading} className="lms-btn lms-btn-primary lms-btn-block">
              {isLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </button>
          </form>

          <p className="lms-auth-note">
            Đã có tài khoản? <Link href="/login">Đăng nhập ngay</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
