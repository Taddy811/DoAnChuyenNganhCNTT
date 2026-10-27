"use client";

import Link from "next/link";

const stats = [
  { value: "03", label: "vai trò", detail: "Admin, giảng viên, sinh viên" },
  { value: "24/7", label: "truy cập", detail: "Học và quản lý mọi lúc" },
  { value: "1", label: "hệ thống", detail: "Lớp học, điểm danh, bài tập" },
  { value: "0", label: "rối rắm", detail: "Giao diện gọn và dễ quét" },
];

const modules = [
  {
    title: "Quản lý lớp học",
    description: "Theo dõi lớp, môn học, giảng viên, lịch học và danh sách sinh viên trong một nơi.",
  },
  {
    title: "Điểm danh QR",
    description: "Giảng viên tạo mã QR, sinh viên quét và hệ thống ghi nhận lịch sử điểm danh.",
  },
  {
    title: "Bài tập online",
    description: "Giao bài, nộp file, hủy nộp, chấm điểm và phản hồi giống luồng Google Classroom.",
  },
];

export default function LandingPage() {
  return (
    <main className="lms-landing">
      <nav className="lms-nav">
        <Link href="/" className="lms-logo" aria-label="E-LEARNING LMS">
          <span className="lms-logo-mark">E</span>
          <span>E-LEARNING LMS</span>
        </Link>

        <div className="lms-nav-links" aria-label="Điều hướng chính">
          <a href="#modules">Tính năng</a>
          <a href="#workflow">Quy trình</a>
          <a href="#dashboard">Dashboard</a>
        </div>

        <Link href="/login" className="lms-btn lms-btn-primary">
          Đăng nhập
        </Link>
      </nav>

      <section className="lms-hero" id="dashboard">
        <div className="lms-hero-copy">
          <p className="lms-kicker">Learning management system</p>
          <h1>E LEARNING LMS</h1>
          <p>
            Nền tảng quản lý học tập trực tuyến cho lớp học, điểm danh QR và bài tập online.
            Giao diện mới tập trung vào thao tác nhanh, dữ liệu rõ ràng và trải nghiệm đồng bộ
            cho admin, giảng viên, sinh viên.
          </p>

          <div className="lms-hero-actions">
            <Link href="/login" className="lms-btn lms-btn-primary">
              Vào hệ thống
            </Link>
            <a href="#modules" className="lms-btn lms-btn-secondary">
              Xem chức năng
            </a>
          </div>
        </div>

        <div className="lms-product-shot" aria-label="Minh họa dashboard LMS">
          <div className="lms-shot-sidebar">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="lms-shot-main">
            <div className="lms-shot-top">
              <div>
                <small>Dashboard</small>
                <strong>Bài tập online</strong>
              </div>
              <span>Đang mở</span>
            </div>
            <div className="lms-shot-grid">
              <div className="lms-shot-card is-large">
                <small>Nộp bài tập Lab01</small>
                <strong>7 điểm</strong>
                <div className="lms-shot-progress"><span style={{ width: "68%" }} /></div>
              </div>
              <div className="lms-shot-card">
                <small>Đã nộp</small>
                <strong>18/24</strong>
              </div>
              <div className="lms-shot-card">
                <small>Điểm danh</small>
                <strong>92%</strong>
              </div>
            </div>
            <div className="lms-shot-table">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </section>

      <section className="lms-stat-band" aria-label="Thống kê nhanh">
        {stats.map((item) => (
          <div key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
            <p>{item.detail}</p>
          </div>
        ))}
      </section>

      <section className="lms-section" id="modules">
        <div className="lms-section-heading">
          <p className="lms-kicker">Module chính</p>
          <h2>Một giao diện, đầy đủ luồng LMS</h2>
        </div>

        <div className="lms-module-grid">
          {modules.map((module) => (
            <article key={module.title} className="lms-module-card">
              <h3>{module.title}</h3>
              <p>{module.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lms-workflow" id="workflow">
        <div>
          <p className="lms-kicker">Quy trình học tập</p>
          <h2>Từ giao bài đến chấm điểm trong cùng một dashboard</h2>
        </div>
        <div className="lms-workflow-steps">
          <span>Giảng viên giao bài</span>
          <span>Sinh viên nộp file</span>
          <span>Giảng viên chấm điểm</span>
          <span>Sinh viên xem phản hồi</span>
        </div>
      </section>
    </main>
  );
}
