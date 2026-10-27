/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Scanner } from '@yudiel/react-qr-scanner'; // Thư viện quét QR
import ProfileSettings from "@/components/ProfileSettings";
import ThemeToggle from "@/components/ThemeToggle";
import StudentAssignments from "@/components/StudentAssignments";

const scannerConstraints: MediaTrackConstraints = { facingMode: "environment" };

type SidebarIconName =
  | "logo"
  | "overview"
  | "qr"
  | "assignments"
  | "classes"
  | "calendar"
  | "history"
  | "profile"
  | "logout";

const sidebarIconPaths: Record<SidebarIconName, ReactNode> = {
  logo: (
    <>
      <path d="m4 8 8-4 8 4-8 4-8-4Z" />
      <path d="m6 10 6 3 6-3" />
      <path d="M8 12v4c2.4 1.7 5.6 1.7 8 0v-4" />
    </>
  ),
  overview: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  qr: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M14 14h2v2h-2z" />
      <path d="M19 14h2v3" />
      <path d="M14 19h3" />
      <path d="M19 21h2" />
    </>
  ),
  assignments: (
    <>
      <path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M15 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </>
  ),
  classes: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6" />
      <path d="M9 10h.01" />
      <path d="M15 10h.01" />
      <path d="M9 13h.01" />
      <path d="M15 13h.01" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="M3 10h18" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
    </>
  ),
  history: (
    <>
      <path d="M9 4h6l1 2h3v15H5V6h3l1-2Z" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
      <path d="M9 4h6" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  logout: (
    <>
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 3v18h-6" />
    </>
  ),
};

function SidebarIcon({ name, className = "" }: { name: SidebarIconName; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {sidebarIconPaths[name]}
    </svg>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: SidebarIconName;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left text-[15px] font-bold transition ${
        active
          ? "border-violet-200 bg-violet-50 text-violet-700 shadow-sm"
          : "border-transparent text-slate-500 hover:border-violet-100 hover:bg-violet-50/60 hover:text-violet-700"
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          active ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-500 group-hover:bg-violet-100 group-hover:text-violet-700"
        }`}
      >
        <SidebarIcon name={icon} className="h-5 w-5" />
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("dashboard"); 

  // ================= STATE DỮ LIỆU CHUNG =================
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [sessionsData, setSessionsData] = useState<any[]>([]);

  // ================= STATE QUẢN LÝ QR =================
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // ================= STATE CALENDAR (TAB 1 & TAB 3) =================
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // ================= STATE LỚP HỌC CỦA TÔI (TAB 2) =================
  const [mcSearch, setMcSearch] = useState("");
  const [mcShift, setMcShift] = useState("");
  const [mcSubject, setMcSubject] = useState("");

  // ================= STATE LỊCH HỌC (TAB 3) =================
  const [scheduleViewMode, setScheduleViewMode] = useState<'calendar' | 'list'>('calendar'); 
  const [scheduleStartDate, setScheduleStartDate] = useState("");
  const [scheduleEndDate, setScheduleEndDate] = useState("");
  const [scheduleSubject, setScheduleSubject] = useState("");

  // ================= STATE LỊCH SỬ ĐIỂM DANH (TAB 4) =================
  const [historyFilterClassName, setHistoryFilterClassName] = useState<string | null>(null);
  const [historyFilterStatus, setHistoryFilterStatus] = useState("");
  const [historyFilterStartDate, setHistoryFilterStartDate] = useState("");
  const [historyFilterEndDate, setHistoryFilterEndDate] = useState("");

  const normalizeRole = (role: unknown) => {
    const value = String(role || "").trim().toLowerCase();
    const plainValue = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (plainValue.includes("admin") || plainValue.includes("quan tri")) return "admin";
    if (plainValue.includes("instructor") || plainValue.includes("giang") || plainValue.includes("giao")) return "instructor";
    if (plainValue.includes("student") || plainValue.includes("sinh") || plainValue.includes("hoc")) return "student";

    return "student";
  };

  const parseVietnameseDate = (value: unknown) => {
    if (typeof value !== "string") return null;

    const parts = value.split("/");
    if (parts.length !== 3) return null;

    const [day, month, year] = parts.map(Number);
    if (!day || !month || !year) return null;

    const parsedDate = new Date(year, month - 1, day);
    const isValidDate =
      parsedDate.getFullYear() === year &&
      parsedDate.getMonth() === month - 1 &&
      parsedDate.getDate() === day;

    return isValidDate ? parsedDate : null;
  };

  const getHistorySortTime = (item: any) => {
    const updatedDate = item?.updatedAt ? new Date(item.updatedAt) : null;
    if (updatedDate && !Number.isNaN(updatedDate.getTime())) return updatedDate.getTime();

    return parseVietnameseDate(item?.date)?.getTime() ?? 0;
  };

  async function fetchMyClasses(studentName: string, studentUsername: string) {
    try {
      const res = await fetch("/api/classes");
      if (res.ok) {
        const allClasses = await res.json();
        const enrolledClasses = allClasses.filter((c: any) => 
          c.students && (c.students.includes(studentName) || c.students.includes(studentUsername))
        );
        setMyClasses(enrolledClasses);
      }
    } catch (error) {
      console.error("Lỗi tải lớp học:", error);
    }
  }

  async function fetchAttendanceHistory(studentName: string, studentUsername = "") {
    try {
      const res = await fetch("/api/attendance");
      if (res.ok) {
        const data = await res.json();
        const historyList = Array.isArray(data) ? data : [];
        const myHistory = historyList.filter((d: any) => d.studentName === studentName || (studentUsername && d.studentName === studentUsername));
        const sortedHistory = myHistory.sort((a: any, b: any) => {
            return getHistorySortTime(b) - getHistorySortTime(a);
        });
        setHistoryData(sortedHistory);
      }
    } catch (error) {
      console.error("Lỗi tải lịch sử:", error);
    }
  }

  async function fetchSessions() {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) setSessionsData(await res.json());
    } catch (error) {
      console.error("Lỗi tải buổi học:", error);
    }
  }

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
    } else {
      try {
        const parsedUser = JSON.parse(userData);
        const normalizedUser = { ...parsedUser, role: normalizeRole(parsedUser?.role), username: parsedUser?.username || "" };

        if (normalizedUser.role !== 'student') {
          router.push(`/dashboard/${normalizedUser.role}`);
          return;
        }

        setUser(normalizedUser);
        fetchMyClasses(normalizedUser.name, normalizedUser.username);
        fetchAttendanceHistory(normalizedUser.name, normalizedUser.username);
        fetchSessions();
      } catch {
        localStorage.removeItem("user");
        router.push("/login");
        return;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const getCameraErrorMessage = (error: unknown) => {
    const err = error instanceof Error ? error : null;
    const name = err?.name || "";
    const errorMessage = err?.message || "";
    const normalized = `${name} ${errorMessage}`.toLowerCase();

    if (normalized.includes("notallowed") || normalized.includes("permission")) {
      return "Trình duyệt đang chặn camera. Hãy bấm biểu tượng camera trên thanh địa chỉ, chọn Cho phép, rồi bấm Bật camera lại.";
    }

    if (normalized.includes("notfound") || normalized.includes("device")) {
      return "Không tìm thấy camera khả dụng. Hãy kiểm tra webcam hoặc camera trên thiết bị.";
    }

    if (normalized.includes("secure context")) {
      return "Camera chỉ hoạt động trên localhost hoặc HTTPS.";
    }

    return "Không thể mở camera. Hãy kiểm tra quyền camera và thử lại.";
  };

  const handleScannerError = (error: unknown) => {
    setIsCameraActive(false);
    setScanStatus('idle');
    setMessage('');
    setCameraError(getCameraErrorMessage(error));
  };

  const openQrScanner = () => {
    setActiveTab('qr-scan');
    setScanStatus('idle');
    setMessage('');
    setCameraError('');
    setIsCameraActive(false);
  };

  const activateCamera = async () => {
    setCameraError('');
    setScanStatus('idle');
    setMessage('');

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setIsCameraActive(false);
      setCameraError("Trình duyệt không hỗ trợ mở camera. Hãy thử bằng Chrome hoặc Edge.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: scannerConstraints,
        audio: false,
      });
      stream.getTracks().forEach((track) => track.stop());
      setIsCameraActive(true);
    } catch (error) {
      setIsCameraActive(false);
      setCameraError(getCameraErrorMessage(error));
    }
  };

  const stopCamera = () => {
    setIsCameraActive(false);
  };

  // ================= LOGIC XỬ LÝ QUÉT QR =================
  const handleScan = async (text: string) => {
    if (!text || scanStatus === 'success') return; // Tránh gọi API nhiều lần nếu đã thành công
    try {
      const res = await fetch("/api/student/scan-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: text, studentName: user.name, studentUsername: user.username })
      });
      const data = await res.json();
      if (res.ok) {
        setIsCameraActive(false);
        setScanStatus('success');
        setMessage(`Thành công! Đã ghi nhận có mặt: ${data.className}`);
        fetchAttendanceHistory(user.name, user.username); // Refresh lịch sử
      } else {
        setIsCameraActive(false);
        setScanStatus('error');
        setMessage(data.message);
      }
      setTimeout(() => { setScanStatus('idle'); setMessage(''); }, 3000);
    } catch {
      setScanStatus('error');
      setMessage("Lỗi kết nối đến máy chủ!");
      setTimeout(() => setScanStatus('idle'), 3000);
    }
  };

  // ================= LOGIC GỘP LỊCH HỌC TỰ ĐỘNG & THỦ CÔNG =================
  const dayMap: { [key: string]: number } = { 'Chủ nhật': 0, 'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 3, 'Thứ 5': 4, 'Thứ 6': 5, 'Thứ 7': 6, 'Thứ bảy': 6 };
  
  const today = new Date();
  const todayReset = new Date(today.getFullYear(), today.getMonth(), today.getDate()); 
  const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  const daysOfWeek = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const currentDayName = daysOfWeek[today.getDay()];

  const generateMySchedule = () => {
    let allSessions: any[] = [];
    
    myClasses.forEach(cls => {
      const autoSessions: any[] = [];
      if (cls.startDate && cls.totalSessions && cls.scheduleDays && cls.scheduleDays.length > 0) {
        const currentDate = new Date(cls.startDate);
        const targetDays = cls.scheduleDays.map((d: string) => dayMap[d]);
        const total = Number(cls.totalSessions) || 0;
        let count = 0; let maxIter = 365;

        while (count < total && maxIter > 0) {
          if (targetDays.includes(currentDate.getDay())) {
            const dd = String(currentDate.getDate()).padStart(2, '0');
            const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
            const yyyy = currentDate.getFullYear();
            
            autoSessions.push({
              classId: cls._id, 
              className: cls.name, 
              subject: cls.subject, 
              instructor: cls.instructor, 
              room: cls.room, 
              shift: cls.shift,
              date: `${dd}/${mm}/${yyyy}`, 
              dateObj: new Date(yyyy, currentDate.getMonth(), currentDate.getDate()), 
              isAuto: true
            });
            count++;
          }
          currentDate.setDate(currentDate.getDate() + 1);
          maxIter--;
        }
      }

      const manualSessions = sessionsData.filter(s => s.classId === cls._id);
      const mergedSessions = [...autoSessions];
      manualSessions.forEach(ms => {
        const idx = mergedSessions.findIndex(s => s.date === ms.date);
        const dateObj = parseVietnameseDate(ms?.date);
        if (!dateObj) return;

        const sessionDataToPush = {
          classId: cls._id, 
          className: cls.name, 
          subject: cls.subject, 
          instructor: cls.instructor, 
          room: cls.room, 
          shift: cls.shift,
          date: ms.date, 
          dateObj: dateObj, 
          isAuto: false
        };
        if (idx !== -1) mergedSessions[idx] = { ...mergedSessions[idx], ...sessionDataToPush };
        else mergedSessions.push(sessionDataToPush);
      });
      allSessions = [...allSessions, ...mergedSessions];
    });
    return allSessions.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  };

  const mySchedule = generateMySchedule();
  const classesToday = mySchedule.filter(s => s.date === todayStr);
  const upcomingClasses = mySchedule.filter(s => {
    const diffTime = s.dateObj.getTime() - todayReset.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7;
  });

  // ================= THỐNG KÊ (CHUNG) =================
  const totalClassesEnrolled = myClasses.length;
  const totalClassesToday = classesToday.length;
  const totalAttended = historyData.filter(h => h.status === 'Có mặt').length;
  const totalLate = historyData.filter(h => h.status === 'Muộn').length;
  const totalAbsent = historyData.filter(h => h.status === 'Vắng').length;
  const totalHistoryCount = historyData.length;
  const attendanceRate = totalHistoryCount > 0 ? ((totalAttended / totalHistoryCount) * 100).toFixed(1) : "0.0";

  // ================= LOGIC CALENDAR (TAB 1 & TAB 3) =================
  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay(); 
  
  const daysInCurrentMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  
  const handlePrevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); } else setCurrentMonth(currentMonth - 1); };
  const handleNextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); } else setCurrentMonth(currentMonth + 1); };
  const handleToday = () => { setCurrentMonth(new Date().getMonth()); setCurrentYear(new Date().getFullYear()); };

  // ================= LOGIC LỚP HỌC CỦA TÔI (TAB 2) =================
  const uniqueSubjectsMyClasses = Array.from(new Set(myClasses.map(c => c.subject)));
  const filteredMyClasses = myClasses.filter(cls => {
    const matchSearch = mcSearch === "" || (cls.name + cls.room + cls.instructor).toLowerCase().includes(mcSearch.toLowerCase());
    const matchShift = mcShift === "" || (cls.shift && cls.shift.startsWith(mcShift));
    const matchSubject = mcSubject === "" || cls.subject === mcSubject;
    return matchSearch && matchShift && matchSubject;
  });
  
  const clearMcFilters = () => { setMcSearch(""); setMcShift(""); setMcSubject(""); };

  const getClassProgress = (className: string, totalSessions: number) => {
    const attendedSessions = historyData.filter(h => h.className === className).length;
    return { attended: attendedSessions, total: totalSessions || 0 };
  };

  const handleViewAttendanceDetails = (className: string) => {
    setHistoryFilterClassName(className); 
    setActiveTab('history'); 
  };

  // ================= LOGIC LỊCH HỌC (TAB 3) =================
  const filteredScheduleSessions = mySchedule.filter(s => {
    const matchSub = scheduleSubject === "" || s.subject === scheduleSubject;
    let matchDate = true;
    if (scheduleStartDate && scheduleEndDate) {
      const sessDate = s.dateObj.getTime();
      const start = new Date(scheduleStartDate).getTime();
      const end = new Date(scheduleEndDate).getTime();
      matchDate = sessDate >= start && sessDate <= end;
    }
    return matchSub && matchDate;
  });

  const clearScheduleFilters = () => { setScheduleStartDate(""); setScheduleEndDate(""); setScheduleSubject(""); };

  // ================= LOGIC LỊCH SỬ ĐIỂM DANH (TAB 4) =================
  const displayedHistoryData = historyData.filter(item => {
    const matchClass = historyFilterClassName ? item.className === historyFilterClassName : true;
    const matchStatus = historyFilterStatus === "" || item.status === historyFilterStatus;
    
    let matchDate = true;
    if (historyFilterStartDate && historyFilterEndDate) {
      const itemDateObj = parseVietnameseDate(item?.date);
      if (!itemDateObj) return false;

      const itemDate = itemDateObj.getTime();
      const start = new Date(historyFilterStartDate).getTime();
      const end = new Date(historyFilterEndDate).getTime();
      matchDate = itemDate >= start && itemDate <= end;
    }

    return matchClass && matchStatus && matchDate;
  });

  const hTotalSessions = displayedHistoryData.length; 
  const hOnTime = displayedHistoryData.filter(h => h.status === 'Có mặt').length;
  const hAbsent = displayedHistoryData.filter(h => h.status === 'Vắng').length;
  const hLate = displayedHistoryData.filter(h => h.status === 'Muộn').length;
  const hRate = hTotalSessions > 0 ? (((hOnTime + hLate) / hTotalSessions) * 100).toFixed(1) : "0.0";
  
  const historyFilteredClassData = historyFilterClassName ? myClasses.find(c => c.name === historyFilterClassName) : null;
  const activeTabLabel =
    activeTab === 'dashboard' ? 'Tổng quan' :
    activeTab === 'qr-scan' ? 'Quét QR' :
    activeTab === 'assignments' ? 'Bài tập online' :
    activeTab === 'myclasses' ? 'Lớp học của tôi' :
    activeTab === 'schedule' ? 'Lịch học' :
    activeTab === 'history' ? 'Lịch sử điểm danh' :
    'Thông tin cá nhân';

  const studentNavItems: { id: string; label: string; icon: SidebarIconName; action: () => void }[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: 'overview', action: () => setActiveTab('dashboard') },
    { id: 'qr-scan', label: 'Quét QR', icon: 'qr', action: openQrScanner },
    { id: 'assignments', label: 'Bài tập online', icon: 'assignments', action: () => setActiveTab('assignments') },
    { id: 'myclasses', label: 'Lớp học', icon: 'classes', action: () => setActiveTab('myclasses') },
    { id: 'schedule', label: 'Lịch học', icon: 'calendar', action: () => setActiveTab('schedule') },
    { id: 'history', label: 'Lịch sử điểm danh', icon: 'history', action: () => { setActiveTab('history'); setHistoryFilterClassName(null); } },
    { id: 'profile', label: 'Cá nhân', icon: 'profile', action: () => setActiveTab('profile') },
  ];

  const dashboardStats = [
    { label: 'Lớp đang học', value: totalClassesEnrolled, detail: 'Đã ghi danh', icon: '📚', color: 'text-violet-700 bg-violet-50 border-violet-100' },
    { label: 'Hôm nay', value: totalClassesToday, detail: `${currentDayName}, ${todayStr}`, icon: '📅', color: 'text-sky-700 bg-blue-50 border-blue-100' },
    { label: 'Đã có mặt', value: totalAttended, detail: `${totalHistoryCount} lần điểm danh`, icon: '✓', color: 'text-green-700 bg-green-50 border-green-100' },
    { label: 'Tỷ lệ tham gia', value: `${attendanceRate}%`, detail: 'Theo lịch sử điểm danh', icon: '%', color: 'text-amber-700 bg-amber-50 border-amber-100' },
  ];

  if (!user) return <div className="p-10 text-center">Đang tải dữ liệu sinh viên...</div>;

  return (
    <div className="dashboard-theme min-h-screen bg-[#f4f5fb] font-sans text-slate-800">
      
      {/* ================= SIDEBAR (STUDENT) ================= */}
      <aside className="border-b border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-72 lg:border-b-0 lg:border-r">
        <div className="flex h-20 items-center gap-3 px-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <SidebarIcon name="logo" className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase text-violet-500">Không gian học tập</p>
            <div className="truncate text-lg font-black leading-tight text-slate-800">Student LMS</div>
          </div>
        </div>

        <nav className="grid gap-2 px-4 pb-4 sm:grid-cols-2 lg:block lg:space-y-2 lg:overflow-y-auto lg:pb-0">
          {studentNavItems.map(item => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={item.action}
            />
          ))}
        </nav>

        <div className="hidden border-t border-slate-100 p-4 lg:block">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-extrabold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
              <SidebarIcon name="logout" className="h-4 w-4" />
            </span>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="lg:ml-72">
        
        {/* HEADER */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#f4f5fb]/95 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500">
                Sinh viên <span className="mx-1 text-slate-300">/</span> <span className="text-slate-800">{activeTabLabel}</span>
              </p>
              <h1 className="mt-1 text-xl font-black leading-tight text-slate-800">{activeTabLabel}</h1>
            </div>
          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />
            <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 text-violet-600">🎓</span>
              <span className="max-w-[220px] truncate">{user.email || user.name}</span>
            </span>
            <button onClick={handleLogout} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-extrabold text-rose-500 transition hover:bg-rose-50">Đăng xuất</button>
          </div>
          </div>
        </header>

        <div className="min-h-[calc(100vh-81px)] bg-[#f4f5fb] px-4 py-5 md:px-8 md:py-6">
          
          {/* ================= TAB: QUÉT QR ================= */}
          {activeTab === 'qr-scan' && (
            <div className="max-w-2xl mx-auto mt-10">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-violet-600 to-indigo-500 text-white text-center">
                  <h2 className="text-2xl font-black mb-2 flex items-center justify-center gap-2"><span>📷</span> Quét mã QR</h2>
                  <p className="text-violet-100 text-sm">Đưa mã QR trên màn hình của Giảng viên vào khung hình bên dưới để tự động điểm danh.</p>
                </div>
                
                <div className="p-8 flex flex-col items-center">
                  <div className="w-full max-w-sm aspect-square rounded-2xl overflow-hidden border-4 border-dashed border-violet-500 relative bg-gray-50 flex items-center justify-center">
                    
                    {isCameraActive ? (
                    <Scanner
                     constraints={scannerConstraints}
                     onScan={(result: any) => {
                     if (result && result.length > 0) {
                        handleScan(result[0].rawValue); // Thư viện mới trả về 1 mảng, nên lấy phần tử đầu tiên
                       }
                    }} 
                    onError={handleScannerError}
                    />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-violet-50 text-violet-600 border border-violet-100 flex items-center justify-center text-2xl font-black mb-4">▣</div>
                        <div className="text-base font-extrabold text-gray-800 mb-2">Camera chưa bật</div>
                        <p className={`text-sm font-semibold leading-relaxed ${cameraError ? 'text-red-600' : 'text-gray-500'}`}>
                          {cameraError || 'Bấm nút bên dưới để mở camera và quét mã QR điểm danh.'}
                        </p>
                        <button onClick={activateCamera} className="mt-5 px-5 py-2.5 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors">
                          Bật camera
                        </button>
                      </div>
                    )}
                    
                    {/* Lớp phủ báo trạng thái thành công/thất bại */}
                    {scanStatus !== 'idle' && (
                      <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center text-white font-bold p-6 text-center ${scanStatus === 'success' ? 'bg-green-500/95' : 'bg-red-500/95'}`}>
                        <div className="text-6xl mb-4">{scanStatus === 'success' ? '✅' : '❌'}</div>
                        <p className="text-lg">{message}</p>
                      </div>
                    )}
                  </div>
                  {isCameraActive && (
                    <button onClick={stopCamera} className="mt-4 px-4 py-2 rounded-md border border-gray-200 bg-white text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors">
                      Tắt camera
                    </button>
                  )}
                   
                  <div className="mt-8 text-center text-sm text-gray-500 font-medium bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <p className="mb-1">💡 Đảm bảo bạn cho phép trình duyệt truy cập <strong>Camera</strong>.</p>
                    <p className="text-red-500">Mã QR của giảng viên sẽ thay đổi 60 giây.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <StudentAssignments user={user} myClasses={myClasses} />
          )}

          {/* ================= TAB 1: DASHBOARD ================= */}
          {activeTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-4">
              <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-violet-600 uppercase tracking-wide mb-1">{currentDayName}, {todayStr}</div>
                  <h2 className="text-xl font-extrabold text-gray-900 leading-tight">Chào {user.name}</h2>
                  <p className="text-sm text-gray-500 font-medium mt-1">Tổng quan nhanh lịch học, điểm danh và các lớp đang theo học.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={openQrScanner} className="px-4 py-2 rounded-md bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors">Quét QR</button>
                  <button onClick={() => setActiveTab('schedule')} className="px-4 py-2 rounded-md bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors">Xem lịch</button>
                </div>
              </section>

              <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {dashboardStats.map(stat => (
                  <div key={stat.label} className={`bg-white rounded-xl border shadow-sm p-4 ${stat.color}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide opacity-80">{stat.label}</div>
                        <div className="text-2xl font-extrabold text-gray-900 mt-1">{stat.value}</div>
                      </div>
                      <div className="w-9 h-9 rounded-lg bg-white/80 border border-white flex items-center justify-center text-sm font-black">{stat.icon}</div>
                    </div>
                    <div className="text-xs font-semibold text-gray-500 mt-3 truncate">{stat.detail}</div>
                  </div>
                ))}
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-4 items-start">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)] overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-base">Lịch hôm nay</h3>
                      <p className="text-xs text-gray-500 font-semibold">{totalClassesToday} buổi học</p>
                    </div>
                    <button onClick={() => setActiveTab('schedule')} className="text-xs font-bold text-violet-600 hover:text-violet-700">Chi tiết</button>
                  </div>
                  <div className="p-3 space-y-2">
                    {classesToday.length === 0 ? (
                      <div className="py-8 text-center text-sm text-gray-400 font-semibold">Hôm nay chưa có lịch học.</div>
                    ) : (
                      classesToday.map((cls, idx) => (
                        <div key={idx} className="rounded-lg border border-gray-100 bg-gray-50 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 truncate">{cls.className}</div>
                            <div className="text-xs text-gray-500 mt-1 truncate">{cls.subject} · {cls.instructor}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2.5 py-1 rounded border border-pink-100 bg-pink-50 text-pink-700 text-xs font-bold">{cls.room || 'N/A'}</span>
                            <span className="px-2.5 py-1 rounded border border-orange-100 bg-orange-50 text-orange-700 text-xs font-bold">{cls.shift ? cls.shift.split(' (')[0] : 'Ca học'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)] overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-base">Sắp tới</h3>
                      <p className="text-xs text-gray-500 font-semibold">7 ngày gần nhất</p>
                    </div>
                    <span className="text-xs font-bold text-gray-400">{upcomingClasses.length} lịch</span>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-[356px] overflow-y-auto">
                    {upcomingClasses.length === 0 ? (
                      <div className="py-8 text-center text-sm text-gray-400 font-semibold">Chưa có lịch học sắp tới.</div>
                    ) : (
                      upcomingClasses.slice(0, 7).map((cls, idx) => (
                        <div key={idx} className="px-4 py-3 hover:bg-gray-50 transition-colors flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-gray-900 truncate">{cls.className}</div>
                            <div className="text-xs text-gray-500 mt-1 truncate">{cls.subject}</div>
                            <div className="text-xs text-gray-500 mt-1">{daysOfWeek[cls.dateObj.getDay()]}, {cls.date}</div>
                          </div>
                          <span className="px-2 py-1 rounded bg-violet-50 text-violet-700 border border-violet-100 text-xs font-bold shrink-0">{cls.shift ? cls.shift.split(' (')[0] : 'Ca'}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-4 items-start">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-base">Tình hình điểm danh</h3>
                      <p className="text-xs text-gray-500 font-semibold">Dựa trên lịch sử đã ghi nhận</p>
                    </div>
                    <div className="text-2xl font-extrabold text-violet-600">{attendanceRate}%</div>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${attendanceRate}%` }}></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="rounded-lg bg-green-50 border border-green-100 p-2"><div className="text-lg font-black text-green-700">{totalAttended}</div><div className="text-[11px] font-bold text-gray-500">Có mặt</div></div>
                    <div className="rounded-lg bg-amber-50 border border-amber-100 p-2"><div className="text-lg font-black text-amber-700">{totalLate}</div><div className="text-[11px] font-bold text-gray-500">Muộn</div></div>
                    <div className="rounded-lg bg-red-50 border border-red-100 p-2"><div className="text-lg font-black text-red-700">{totalAbsent}</div><div className="text-[11px] font-bold text-gray-500">Vắng</div></div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)] overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-base">Lớp đang học</h3>
                      <p className="text-xs text-gray-500 font-semibold">{myClasses.length} lớp</p>
                    </div>
                    <button onClick={() => setActiveTab('myclasses')} className="text-xs font-bold text-violet-600 hover:text-violet-700">Xem tất cả</button>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {myClasses.length === 0 ? (
                      <div className="py-8 text-center text-sm text-gray-400 font-semibold">Bạn chưa tham gia lớp học nào.</div>
                    ) : (
                      myClasses.slice(0, 5).map((cls, idx) => {
                        const progress = getClassProgress(cls.name, cls.totalSessions);
                        const percentage = progress.total > 0 ? (progress.attended / progress.total) * 100 : 0;
                        return (
                          <div key={cls._id || idx} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-bold text-sm text-gray-900 truncate">{cls.name}</div>
                                <div className="text-xs text-gray-500 mt-1 truncate">{cls.subject} · {cls.instructor}</div>
                              </div>
                              <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 border border-gray-200 text-xs font-bold shrink-0">{cls.shift ? cls.shift.split(' (')[0] : 'Ca học'}</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                                <div className="h-full rounded-full bg-violet-600" style={{ width: `${percentage}%` }}></div>
                              </div>
                              <span className="text-[11px] font-bold text-gray-500">{progress.attended}/{progress.total}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ================= TAB 2: LỚP HỌC CỦA TÔI ================= */}
          {activeTab === 'myclasses' && (
            <div className="max-w-7xl mx-auto space-y-4">
              <div className="bg-gradient-to-r from-violet-600 to-indigo-500 text-white rounded-t-2xl p-4 flex justify-between items-center shadow-md">
                <h2 className="text-lg font-bold flex items-center gap-2"><span>🏫</span> Lớp học của tôi</h2>
              </div>

              <div className="bg-white p-4 rounded-b-2xl shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span><input type="text" placeholder="Tìm kiếm lớp học, giảng viên..." value={mcSearch} onChange={e => setMcSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 bg-white"/></div>
                  <select value={mcShift} onChange={e => setMcShift(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 text-gray-600 bg-white"><option value="">Tất cả ca học</option><option value="Ca 1">Ca 1</option><option value="Ca 2">Ca 2</option><option value="Ca 3">Ca 3</option><option value="Ca 4">Ca 4</option><option value="Ca 5">Ca 5</option><option value="Ca 6">Ca 6</option></select>
                  <select value={mcSubject} onChange={e => setMcSubject(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 text-gray-600 bg-white"><option value="">Tất cả môn học</option>{uniqueSubjectsMyClasses.map(sub => <option key={sub} value={sub}>{sub}</option>)}</select>
                  <button onClick={clearMcFilters} className="text-sm font-bold text-red-500 hover:text-red-700 h-fit py-2">Xóa bộ lọc</button>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs">
                      <tr><th className="px-4 py-3 font-bold text-center w-16 uppercase tracking-wider">STT</th><th className="px-4 py-3 font-bold uppercase tracking-wider">Tên lớp / Môn học</th><th className="px-4 py-3 font-bold uppercase tracking-wider">Phòng</th><th className="px-4 py-3 font-bold uppercase tracking-wider">Giảng viên</th><th className="px-4 py-3 font-bold text-center uppercase tracking-wider">Ca học</th><th className="px-4 py-3 font-bold uppercase tracking-wider">Lịch học</th><th className="px-4 py-3 font-bold uppercase tracking-wider w-40">Buổi học (Tiến độ)</th><th className="px-4 py-3 font-bold text-center uppercase tracking-wider">Thao tác</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {filteredMyClasses.length === 0 ? (
                        <tr><td colSpan={8} className="text-center py-10 text-gray-400 font-medium bg-white">Không tìm thấy lớp học nào phù hợp.</td></tr>
                      ) : (
                        filteredMyClasses.map((cls, index) => {
                          const progress = getClassProgress(cls.name, cls.totalSessions);
                          const percentage = progress.total > 0 ? (progress.attended / progress.total) * 100 : 0;
                          return (
                            <tr key={cls._id} className="hover:bg-gray-50/50 bg-white transition-colors">
                              <td className="px-4 py-3 text-center font-medium text-gray-500">{index + 1}</td>
                              <td className="px-4 py-3"><div className="font-extrabold text-gray-900 text-sm">{cls.name}</div><div className="text-xs text-gray-500 mt-0.5">{cls.subject}</div></td>
                              <td className="px-4 py-3 font-medium text-pink-700"><span className="bg-pink-50 border border-pink-100 px-2.5 py-1 rounded text-xs font-semibold">{cls.room || 'N/A'}</span></td>
                              <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">👤</div><span>{cls.instructor}</span></td>
                              <td className="px-4 py-3 text-center font-bold text-orange-600"><span className="bg-orange-50 border border-orange-100 px-2 py-0.5 rounded text-xs uppercase">{cls.shift ? cls.shift.split(' (')[0] : 'N/A'}</span></td>
                              <td className="px-4 py-3 font-medium text-violet-600">📅 {cls.scheduleDays?.join(', ') || 'N/A'}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-between text-xs font-bold text-gray-600 mb-1.5"><span>{percentage.toFixed(0)}%</span><span>{progress.attended}/{progress.total} buổi</span></div>
                                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden"><div className={`h-1.5 rounded-full transition-all ${percentage >= 100 ? 'bg-green-500' : 'bg-violet-600'}`} style={{ width: `${percentage}%` }}></div></div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button onClick={() => handleViewAttendanceDetails(cls.name)} className="bg-white border border-violet-200 text-violet-600 hover:bg-violet-50 px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap mx-auto">
                                   Xem lịch sử
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: LỊCH HỌC CALENDAR & LIST ================= */}
          {activeTab === 'schedule' && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)] overflow-hidden flex flex-col h-full relative">
               <div className="p-4 bg-gradient-to-r from-violet-600 to-indigo-500 text-white rounded-t-2xl flex justify-between items-center shadow-md shrink-0">
                  <h2 className="text-lg font-bold flex items-center gap-2"><span className="text-xl">📅</span> Lịch học</h2>
                  <div className="flex bg-white/20 p-1 rounded-lg">
                      <button onClick={() => setScheduleViewMode('calendar')} className={`px-4 py-1.5 rounded-md text-xs font-bold shadow-sm transition-colors ${scheduleViewMode === 'calendar' ? 'bg-white text-violet-600' : 'text-white hover:bg-white/10'}`}>📅 Lịch</button>
                      <button onClick={() => setScheduleViewMode('list')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${scheduleViewMode === 'list' ? 'bg-white text-violet-600' : 'text-white hover:bg-white/10'}`}>🗂️ Danh sách</button>
                  </div>
              </div>

              <div className="bg-white p-4 rounded-b-2xl shadow-sm border border-gray-200 flex-1 overflow-y-auto">
                <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-700">Bộ lọc:</span>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-md border border-gray-200">
                      <input type="date" value={scheduleStartDate} onChange={(e) => setScheduleStartDate(e.target.value)} className="bg-transparent px-2 py-2 text-sm outline-none text-gray-600"/>
                      <span className="text-gray-400">→</span>
                      <input type="date" value={scheduleEndDate} onChange={(e) => setScheduleEndDate(e.target.value)} className="bg-transparent px-2 py-2 text-sm outline-none text-gray-600"/>
                    </div>
                    <select value={scheduleSubject} onChange={(e) => setScheduleSubject(e.target.value)} className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 text-gray-700 bg-gray-50 min-w-[200px]">
                      <option value="">Tất cả môn học</option>
                      {uniqueSubjectsMyClasses.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                    <button onClick={clearScheduleFilters} className="text-sm font-bold text-gray-500 hover:text-red-600 border border-gray-200 bg-white hover:bg-red-50 px-4 py-2 rounded-md transition-colors shadow-sm">
                      Xóa bộ lọc
                    </button>
                </div>

                {scheduleViewMode === 'calendar' ? (
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-violet-600 p-3 flex justify-between items-center text-white">
                      <div className="font-bold text-lg ml-2">tháng {currentMonth + 1} {currentYear}</div>
                      <div className="flex items-center gap-1 bg-white/20 rounded-lg p-1">
                        <button onClick={handlePrevMonth} className="px-3 py-1.5 hover:bg-white/10 rounded font-bold transition-colors">&lt;</button>
                        <button onClick={handleToday} className="px-4 py-1.5 text-sm font-bold bg-white text-violet-600 rounded hover:bg-gray-100 transition-colors">Hôm nay</button>
                        <button onClick={handleNextMonth} className="px-3 py-1.5 hover:bg-white/10 rounded font-bold transition-colors">&gt;</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 border-b border-gray-100 bg-white">
                      {dayNames.map(day => (<div key={day} className="py-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100 last:border-r-0">{day}</div>))}
                    </div>

                    <div className="grid grid-cols-7 bg-gray-50 gap-px flex-1">
                      {Array.from({ length: firstDay }).map((_, idx) => (<div key={`empty-${idx}`} className="bg-white p-2 min-h-[96px]"></div>))}
                      {Array.from({ length: daysInCurrentMonth }).map((_, idx) => {
                        const dayNum = idx + 1;
                        const dateStr = `${String(dayNum).padStart(2, '0')}/${String(currentMonth + 1).padStart(2, '0')}/${currentYear}`;
                        const sessionsOnThisDay = mySchedule.filter(s => s.date === dateStr);
                        const isToday = new Date().getDate() === dayNum && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;

                        return (
                          <div key={dayNum} className={`bg-white p-2 min-h-[96px] flex flex-col gap-1 transition-colors hover:bg-violet-50/20 ${isToday ? 'ring-2 ring-inset ring-violet-600 bg-violet-50/10' : ''}`}>
                            <div className={`text-right text-xs font-bold ${isToday ? 'text-violet-600' : 'text-gray-400'}`}>{dayNum}</div>
                            <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
                              {sessionsOnThisDay.map((sess, sIdx) => {
                                let colorClass = "border-gray-200 bg-gray-50 text-gray-700";
                                if (sess.shift?.includes("Ca 1") || sess.shift?.includes("Ca 2")) colorClass = "border-green-300 bg-green-100 text-green-800";
                                else if (sess.shift?.includes("Ca 3") || sess.shift?.includes("Ca 4")) colorClass = "border-blue-300 bg-blue-100 text-blue-800";
                                else if (sess.shift?.includes("Ca 5") || sess.shift?.includes("Ca 6")) colorClass = "border-purple-300 bg-purple-100 text-purple-800";

                                return (
                                  <div key={sIdx} className={`border-l-2 rounded-r px-1.5 py-1.5 text-[10px] leading-tight flex flex-col text-left cursor-pointer hover:opacity-80 transition-opacity shadow-sm ${colorClass}`} title={`${sess.className} - ${sess.subject}`}>
                                    <div className="font-bold truncate">{sess.className}</div>
                                    <div className="truncate opacity-80">{sess.subject}</div>
                                    <div className="mt-0.5 font-semibold flex justify-between gap-1">
                                      <span className="truncate">{sess.room || 'N/A'}</span>
                                      <span className="whitespace-nowrap">{sess.shift ? sess.shift.split(' (')[0] : ''}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )
                      })}
                       {Array.from({ length: (7 - ((firstDay + daysInCurrentMonth) % 7)) % 7 }).map((_, idx) => (<div key={`empty-end-${idx}`} className="bg-white p-2 min-h-[96px]"></div>))}
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
                    <table className="w-full text-left text-sm whitespace-nowrap bg-white">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs">
                        <tr>
                          <th className="px-4 py-3 font-bold text-center w-16 uppercase tracking-wider">STT</th>
                          <th className="px-4 py-3 font-bold uppercase tracking-wider">Ngày giảng dạy</th>
                          <th className="px-4 py-3 font-bold uppercase tracking-wider">Ca học & Phòng</th>
                          <th className="px-4 py-3 font-bold uppercase tracking-wider">Lớp & Môn học</th>
                          <th className="px-4 py-3 font-bold uppercase tracking-wider">Giảng viên</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {filteredScheduleSessions.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-10 text-gray-400 font-medium">Không tìm thấy lịch học nào phù hợp.</td></tr>
                        ) : (
                          filteredScheduleSessions.map((sess, index) => (
                            <tr key={index} className="hover:bg-gray-50/50 bg-white transition-colors">
                              <td className="px-4 py-3 text-center font-medium text-gray-500">{index + 1}</td>
                              <td className="px-4 py-3">
                                <div className="font-bold text-gray-800">{sess.date}</div>
                                <div className="text-xs text-gray-500 mt-0.5 capitalize">{daysOfWeek[sess.dateObj.getDay()]}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="bg-orange-50 text-orange-600 border border-orange-100 px-2.5 py-1 rounded text-xs font-semibold">{sess.shift ? sess.shift.split(' (')[0] : 'N/A'}</span>
                                  🕒 {sess.shift ? sess.shift.match(/\((.*?)\)/)?.[1] : ''}
                                </div>
                                <div className="text-xs font-bold text-pink-700 bg-pink-50 w-fit px-2.5 py-1 rounded border border-pink-100">📍 {sess.room || 'N/A'}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-extrabold text-gray-900 text-sm">{sess.className}</div>
                                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">📘 {sess.subject}</div>
                              </td>
                              <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">👤</div>
                                <span>{sess.instructor}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 4: LỊCH SỬ ĐIỂM DANH ================= */}
          {activeTab === 'history' && (
            <div className="max-w-7xl mx-auto space-y-4">
              
              <div className="bg-gradient-to-r from-violet-600 to-indigo-500 text-white rounded-t-2xl p-4 flex flex-col gap-2 shadow-md">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-3">
                    {historyFilterClassName && (
                      <button onClick={() => setHistoryFilterClassName(null)} className="text-white hover:text-white/80 text-sm font-bold pr-1 flex items-center gap-1 transition-colors">
                        ← Quay lại danh sách lớp
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
                    <span className="text-xl">🗓️</span> Lịch sử điểm danh {historyFilterClassName ? `- ${historyFilterClassName}` : ''}
                  </h2>
                  {historyFilterClassName && historyFilteredClassData ? (
                    <p className="text-sm text-white/80 font-medium">Môn học: {historyFilteredClassData.subject} | Giảng viên: {historyFilteredClassData.instructor}</p>
                  ) : (
                    <p className="text-sm text-white/80 font-medium">Tổng quan lịch sử điểm danh của tất cả các môn</p>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-b-2xl shadow-sm border border-gray-200">
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
                  <div className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col justify-center shadow-sm">
                    <div className="text-gray-500 font-semibold text-xs mb-1">Tổng buổi học</div>
                    <div className="text-violet-600 font-extrabold text-2xl flex items-center gap-2">
                      <span className="text-violet-500 text-2xl"></span> {hTotalSessions}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col justify-center shadow-sm">
                    <div className="text-gray-500 font-semibold text-xs mb-1">Có mặt</div>
                    <div className="text-green-500 font-extrabold text-2xl flex items-center gap-2 mb-1">
                      <span className="text-green-500 text-2xl">✅</span> {hOnTime}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col justify-center shadow-sm">
                    <div className="text-gray-500 font-semibold text-xs mb-1">Đi muộn</div>
                    <div className="text-yellow-500 font-extrabold text-2xl flex items-center gap-2 mb-1">
                      <span className="text-yellow-500 text-2xl">🕒</span> {hLate}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col justify-center shadow-sm">
                    <div className="text-gray-500 font-semibold text-xs mb-1">Vắng mặt</div>
                    <div className="text-red-500 font-extrabold text-2xl flex items-center gap-2">
                      <span className="text-red-500 text-2xl">❌</span> {hAbsent}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col justify-center shadow-sm relative overflow-hidden">
                    <div className="text-gray-500 font-semibold text-xs mb-1">Tỷ lệ tham gia</div>
                    <div className="text-green-500 font-extrabold text-2xl flex items-center gap-2 mb-2">
                      <span className="text-green-500 text-2xl">🏆</span> {hRate}%
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-1.5">
                      <div className="bg-green-500 h-full rounded-full transition-all" style={{ width: `${hRate}%` }}></div>
                    </div>
                    <div className="text-xs font-semibold text-green-600">Đạt yêu cầu</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                  <span className="text-sm font-bold text-gray-700">Bộ lọc:</span>
                  <select value={historyFilterClassName || ""} onChange={(e) => setHistoryFilterClassName(e.target.value || null)} className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 text-gray-700 bg-gray-50 min-w-[150px]">
                    <option value="">Tất cả lớp học</option>
                    {myClasses.map(cls => <option key={cls._id} value={cls.name}>{cls.name}</option>)}
                  </select>
                  <select value={historyFilterStatus} onChange={(e) => setHistoryFilterStatus(e.target.value)} className="border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 text-gray-700 bg-gray-50 min-w-[150px]">
                    <option value="">Tất cả trạng thái</option>
                    <option value="Có mặt">Có mặt</option>
                    <option value="Vắng">Vắng</option>
                    <option value="Muộn">Muộn</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-white rounded-md border border-gray-200 focus-within:border-violet-500 transition-colors">
                      <input type="date" value={historyFilterStartDate} onChange={(e) => setHistoryFilterStartDate(e.target.value)} className="bg-transparent px-3 py-2 text-sm outline-none text-gray-600" title="Từ ngày"/>
                      <span className="text-gray-400">-</span>
                      <input type="date" value={historyFilterEndDate} onChange={(e) => setHistoryFilterEndDate(e.target.value)} className="bg-transparent px-3 py-2 text-sm outline-none text-gray-600" title="Đến ngày"/>
                    </div>
                  </div>
                  <button onClick={() => { setHistoryFilterStatus(""); setHistoryFilterStartDate(""); setHistoryFilterEndDate(""); if(!historyFilterClassName) setHistoryFilterClassName(null); }} className="text-sm font-bold text-gray-500 hover:text-red-600 border border-gray-200 bg-white hover:bg-red-50 px-4 py-2 rounded-md transition-colors shadow-sm">
                    Xóa bộ lọc
                  </button>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-x-auto shadow-sm mt-4">
                  <table className="w-full text-left text-sm whitespace-nowrap bg-white">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs">
                      <tr>
                        <th className="px-4 py-3 font-bold text-center w-16 uppercase tracking-wider">STT</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider">Ngày học</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider">Lớp học</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider">Giảng viên</th>
                        <th className="px-4 py-3 font-bold text-center uppercase tracking-wider">Trạng thái</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {displayedHistoryData.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-10 text-gray-400 font-medium bg-white">
                          {historyFilterClassName 
                            ? `Lớp ${historyFilterClassName} chưa được điểm danh buổi nào.`
                            : 'Chưa có lịch sử điểm danh nào.'}
                        </td></tr>
                      ) : (
                        displayedHistoryData.map((item, index) => {
                          const isPresent = item.status === 'Có mặt';
                          const isAbsent = item.status === 'Vắng';
                          return (
                            <tr key={item._id} className="hover:bg-gray-50/50 bg-white transition-colors">
                              <td className="px-4 py-3 text-center font-medium text-gray-500">{displayedHistoryData.length - index}</td>
                              <td className="px-4 py-3">
                                <div className="font-bold text-gray-800">{item.date}</div>
                                <div className="text-xs text-gray-500 mt-0.5">Ghi: {item.timestamp}</div>
                              </td>
                              <td className="px-4 py-3">
                                 <div className="font-bold text-violet-600">{item.className}</div>
                                 <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">📘 {item.subjectName}</div>
                              </td>
                              <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">👤</div>
                                <span>{item.instructor || myClasses.find(c => c.name === item.className)?.instructor || "Giảng viên"}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-3 py-1 rounded text-xs font-bold shadow-sm border ${isPresent ? 'bg-green-50 text-green-600 border-green-100' : isAbsent ? 'bg-red-50 text-red-600 border-red-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                                  {isPresent ? '✅ Có mặt' : isAbsent ? '❌ Vắng' : '🕒 Muộn'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-500 italic text-xs font-medium">{item.note || '-'}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 5: THÔNG TIN CÁ NHÂN ================= */}
          {activeTab === 'profile' && <ProfileSettings />}

        </div>
      </main>

    </div>
  );
}
