/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import ProfileSettings from "@/components/ProfileSettings";

type TabId = "overview" | "users" | "majors" | "subjects" | "classes" | "profile";
type IconName =
  | "logo"
  | "overview"
  | "users"
  | "majors"
  | "subjects"
  | "classes"
  | "profile"
  | "home"
  | "logout"
  | "refresh"
  | "check"
  | "search"
  | "plus"
  | "upload"
  | "edit"
  | "trash"
  | "eye";

const ACTIVE_STATUS = "Hoạt động";
const INACTIVE_STATUS = "inactive";

const iconPaths: Record<IconName, ReactNode> = {
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
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  majors: (
    <>
      <path d="M4 19.5V5.8A2.8 2.8 0 0 1 6.8 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5" />
      <path d="M8 7h8" />
      <path d="M8 11h6" />
    </>
  ),
  subjects: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5v-12Z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </>
  ),
  classes: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6" />
      <path d="M9 9h.01" />
      <path d="M15 9h.01" />
      <path d="M9 12h.01" />
      <path d="M15 12h.01" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  logout: (
    <>
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 3v18h-6" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 15h10l1-15" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
};

function Icon({ name, className = "" }: { name: IconName; className?: string }) {
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
      {iconPaths[name]}
    </svg>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: IconName;
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
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function StatCard({
  icon,
  label,
  value,
  note,
  tone,
}: {
  icon: IconName;
  label: string;
  value: number | string;
  note: string;
  tone: "violet" | "sky" | "amber" | "emerald";
}) {
  const toneClass = {
    violet: "bg-violet-50 text-violet-600",
    sky: "bg-sky-50 text-sky-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
  }[tone];

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon name={icon} className="h-6 w-6" />
        </span>
        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-500">{note}</span>
      </div>
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <strong className="mt-2 block text-3xl font-black text-slate-800">{value}</strong>
    </article>
  );
}

function OverviewMetric({
  icon,
  label,
  detail,
  value,
  tone,
}: {
  icon: IconName;
  label: string;
  detail: string;
  value: number | string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold text-slate-700">{label}</p>
        <p className="truncate text-xs font-semibold text-slate-400">{detail}</p>
      </div>
      <strong className="text-base font-black text-slate-700">{value}</strong>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold ${getStatusBadgeClass(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}

function getStatusLabel(status?: string) {
  if (isActiveStatus(status)) return ACTIVE_STATUS;
  if (status === "deleted" || status === "Đã xoá" || status === "Đã xóa") return "Đã ẩn";
  if (status === INACTIVE_STATUS) return "Ngừng hoạt động";
  return status || ACTIVE_STATUS;
}

function isActiveStatus(status?: string) {
  const value = String(status || "").trim().toLowerCase();
  const plainValue = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return !value || value === "active" || plainValue === "hoat dong";
}

function getStatusBadgeClass(status?: string) {
  return isActiveStatus(status)
    ? "border-emerald-200 bg-emerald-50 text-emerald-600"
    : "border-rose-200 bg-rose-50 text-rose-600";
}

function getRoleLabel(role?: string) {
  if (role === "admin") return "Admin";
  if (role === "instructor") return "Giảng viên";
  return "Học sinh";
}

function getRoleBadgeClass(role?: string) {
  if (role === "admin") return "border-rose-200 bg-rose-50 text-rose-600";
  if (role === "instructor") return "border-violet-200 bg-violet-50 text-violet-600";
  return "border-sky-200 bg-sky-50 text-sky-600";
}

function getInitials(name?: string) {
  const words = String(name || "Admin").trim().split(/\s+/).filter(Boolean);
  return words.slice(-2).map((word) => word[0]).join("").toUpperCase() || "A";
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ================= STATE DỮ LIỆU =================
  const [usersData, setUsersData] = useState<any[]>([]);
  const [majorsData, setMajorsData] = useState<any[]>([]);
  const [subjectsData, setSubjectsData] = useState<any[]>([]);
  const [classesData, setClassesData] = useState<any[]>([]);

  // ================= STATE MODAL =================
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isMajorModalOpen, setIsMajorModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isClassDetailModalOpen, setIsClassDetailModalOpen] = useState(false);
  const [selectedClassDetail, setSelectedClassDetail] = useState<any>(null);

  const [isUserEdit, setIsUserEdit] = useState(false);
  const [isMajorEdit, setIsMajorEdit] = useState(false);
  const [isSubjectEdit, setIsSubjectEdit] = useState(false);
  const [isClassEdit, setIsClassEdit] = useState(false);

  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editMajorId, setEditMajorId] = useState<string | null>(null);
  const [editSubjectId, setEditSubjectId] = useState<string | null>(null);
  const [editClassId, setEditClassId] = useState<string | null>(null);

  // ================= STATE TÌM KIẾM CƠ BẢN =================
  const [userSearch, setUserSearch] = useState("");
  const [majorSearch, setMajorSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");

  // ================= STATE BỘ LỌC LỚP HỌC =================
  const [classSearch, setClassSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterMajor, setFilterMajor] = useState("");
  const [filterInstructor, setFilterInstructor] = useState("");
  const [filterShift, setFilterShift] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [studentSearchInput, setStudentSearchInput] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  // ================= STATE FORM =================
  const [userForm, setUserForm] = useState({ role: "student", username: "", major: "", name: "", email: "", phone: "" });
  const [majorForm, setMajorForm] = useState({ code: "", name: "", description: "", status: ACTIVE_STATUS });
  const [subjectForm, setSubjectForm] = useState({ code: "", name: "", description: "", status: ACTIVE_STATUS });

  const [classForm, setClassForm] = useState({
    name: "",
    subject: "",
    major: "",
    instructor: "",
    startDate: "",
    shift: "",
    totalSessions: "",
    maxStudents: "",
    room: "",
    scheduleDays: [] as string[],
    students: [] as string[],
    onlineLink: "",
    description: "",
    status: ACTIVE_STATUS,
  });
  const [studentInput, setStudentInput] = useState("");

  // ================= THAM CHIẾU FILE EXCEL =================
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ================= FETCH DỮ LIỆU =================
  const fetchUsers = async () => {
    const res = await fetch("/api/auth/users");
    if (res.ok) setUsersData(await res.json());
  };
  const fetchMajors = async () => {
    const res = await fetch("/api/majors");
    if (res.ok) setMajorsData(await res.json());
  };
  const fetchSubjects = async () => {
    const res = await fetch("/api/subjects");
    if (res.ok) setSubjectsData(await res.json());
  };
  const fetchClasses = async () => {
    const res = await fetch("/api/classes");
    if (res.ok) setClassesData(await res.json());
  };

  const refreshAllData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchUsers(), fetchMajors(), fetchSubjects(), fetchClasses()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const userData = localStorage.getItem("user");
      if (!userData) {
        router.push("/login");
      } else {
        setUser(JSON.parse(userData));
        await refreshAllData();
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const softDeleteConfirmText = "Dữ liệu sẽ được ẩn khỏi danh sách nhưng vẫn được lưu trong hệ thống để tra cứu lịch sử.";

  const confirmSoftDelete = (label: string) => confirm(`Ẩn "${label}" khỏi danh sách?\n\n${softDeleteConfirmText}`);

  const handleSoftDelete = async (url: string, label: string, refresh: () => void) => {
    if (!confirmSoftDelete(label)) return;

    try {
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.message || "Không thể ẩn dữ liệu. Vui lòng thử lại.");
        return;
      }
      alert(data?.message || "Đã ẩn dữ liệu thành công.");
      refresh();
    } catch {
      alert("Lỗi mạng khi ẩn dữ liệu.");
    }
  };

  // ================= XỬ LÝ UPLOAD EXCEL =================
  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt?.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const formattedData = data
          .map((row: any) => {
            const rawRole = String(row["Vai trò"] || row["Role"] || "").toLowerCase().trim();

            let finalRole = "";
            let prefix = "CF";

            if (rawRole === "giảng viên" || rawRole === "instructor" || rawRole === "giáo viên") {
              finalRole = "instructor";
              prefix = "GV";
            } else if (rawRole === "học sinh" || rawRole === "sinh viên" || rawRole === "student") {
              finalRole = "student";
              prefix = "SV";
            }

            const randomNum = Math.floor(100000 + Math.random() * 900000);
            const generatedUsername = `${prefix}${randomNum}`;

            return {
              username: generatedUsername,
              name: row["Họ tên"] || row["HoTen"] || row["Name"],
              email: row["Email"] || row["email"],
              phone: row["SĐT"] || row["SDT"] || row["Phone"] ? String(row["SĐT"] || row["SDT"] || row["Phone"]) : "",
              major: row["Chuyên ngành"] || row["ChuyenNganh"] || "",
              role: finalRole,
            };
          })
          .filter((u: any) => u.name && u.email && u.role !== "");

        if (formattedData.length === 0) {
          alert("File không hợp lệ! Vui lòng đảm bảo file có đủ các cột: Họ tên, Email, Vai trò.");
          return;
        }

        const res = await fetch("/api/auth/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formattedData),
        });

        if (res.ok) {
          const result = await res.json();
          alert(`Đã thêm thành công ${result.insertedCount || formattedData.length} người dùng mới từ Excel!`);
          fetchUsers();
        } else {
          alert("Có lỗi xảy ra khi lưu dữ liệu vào hệ thống.");
        }
      } catch (error) {
        console.error(error);
        alert("Lỗi khi đọc file Excel.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  // ================= HANDLERS LỚP HỌC =================
  const toggleDay = (day: string) => {
    const currentDays = [...classForm.scheduleDays];
    if (currentDays.includes(day)) setClassForm({ ...classForm, scheduleDays: currentDays.filter((d) => d !== day) });
    else setClassForm({ ...classForm, scheduleDays: [...currentDays, day] });
  };

  const handleAddStudent = (e: any) => {
    e.preventDefault();
    if (studentInput.trim() !== "" && !classForm.students.includes(studentInput.trim())) {
      setClassForm({ ...classForm, students: [...classForm.students, studentInput.trim()] });
      setStudentInput("");
    }
  };

  const handleSelectStudentFromDropdown = (studentName: string) => {
    if (!classForm.students.includes(studentName)) {
      setClassForm({ ...classForm, students: [...classForm.students, studentName] });
    }
    setStudentSearchInput("");
    setShowStudentDropdown(false);
  };

  const removeStudent = (index: number) => {
    const newStudents = [...classForm.students];
    newStudents.splice(index, 1);
    setClassForm({ ...classForm, students: newStudents });
  };

  const handleClassSubmit = async (e: any) => {
    e.preventDefault();
    try {
      let url = "/api/classes";
      let method = "POST";
      if (isClassEdit && editClassId) {
        url = `/api/classes/${editClassId}`;
        method = "PUT";
      }
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(classForm) });
      if (res.ok) {
        alert("Thành công!");
        setIsClassModalOpen(false);
        fetchClasses();
      } else alert("Lỗi!");
    } catch (error) {
      console.error(error);
      alert("Lỗi mạng!");
    }
  };

  const deleteClass = async (id: string, name: string) => handleSoftDelete(`/api/classes/${id}`, `lớp ${name}`, fetchClasses);

  const openClassAdd = () => {
    setIsClassEdit(false);
    setEditClassId(null);
    setClassForm({
      name: "",
      subject: "",
      major: "",
      instructor: "",
      startDate: "",
      shift: "",
      totalSessions: "",
      maxStudents: "",
      room: "",
      scheduleDays: [],
      students: [],
      onlineLink: "",
      description: "",
      status: ACTIVE_STATUS,
    });
    setStudentInput("");
    setStudentSearchInput("");
    setIsClassModalOpen(true);
  };

  const openClassEdit = (cls: any) => {
    setIsClassEdit(true);
    setEditClassId(cls._id);
    setClassForm({ ...cls, scheduleDays: cls.scheduleDays || [], students: cls.students || [] });
    setStudentInput("");
    setStudentSearchInput("");
    setIsClassModalOpen(true);
  };

  const openClassDetail = (cls: any) => {
    setSelectedClassDetail(cls);
    setIsClassDetailModalOpen(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // ================= CÁC HANDLER KHÁC =================
  const handleUserSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const payload: any = { ...userForm, major: userForm.role === "student" ? userForm.major : "" };
      let url = "/api/auth/register";
      let method = "POST";
      if (isUserEdit && editUserId) {
        url = `/api/auth/users/${editUserId}`;
        method = "PUT";
      } else {
        payload.password = "123456";
      }
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        alert("Thành công!");
        setIsUserModalOpen(false);
        fetchUsers();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteUser = async (id: string, name: string) => handleSoftDelete(`/api/auth/users/${id}`, name, fetchUsers);

  const openUserEdit = (usr: any) => {
    setIsUserEdit(true);
    setEditUserId(usr._id);
    setUserForm({ role: usr.role, username: usr.username || "", major: usr.major || "", name: usr.name, email: usr.email, phone: usr.phone || "" });
    setIsUserModalOpen(true);
  };

  const openUserAdd = () => {
    setIsUserEdit(false);
    setEditUserId(null);
    setUserForm({ role: "student", username: "", major: "", name: "", email: "", phone: "" });
    setIsUserModalOpen(true);
  };

  const handleMajorSubmit = async (e: any) => {
    e.preventDefault();
    try {
      let url = "/api/majors";
      let method = "POST";
      if (isMajorEdit && editMajorId) {
        url = `/api/majors/${editMajorId}`;
        method = "PUT";
      }
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(majorForm) });
      if (res.ok) {
        alert("Thành công!");
        setIsMajorModalOpen(false);
        fetchMajors();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteMajor = async (id: string, name: string) => handleSoftDelete(`/api/majors/${id}`, name, fetchMajors);
  const openMajorEdit = (major: any) => {
    setIsMajorEdit(true);
    setEditMajorId(major._id);
    setMajorForm({ code: major.code, name: major.name, description: major.description || "", status: major.status || ACTIVE_STATUS });
    setIsMajorModalOpen(true);
  };

  const openMajorAdd = () => {
    setIsMajorEdit(false);
    setEditMajorId(null);
    setMajorForm({ code: "", name: "", description: "", status: ACTIVE_STATUS });
    setIsMajorModalOpen(true);
  };

  const handleSubjectSubmit = async (e: any) => {
    e.preventDefault();
    try {
      let url = "/api/subjects";
      let method = "POST";
      if (isSubjectEdit && editSubjectId) {
        url = `/api/subjects/${editSubjectId}`;
        method = "PUT";
      }
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(subjectForm) });
      if (res.ok) {
        alert("Thành công!");
        setIsSubjectModalOpen(false);
        fetchSubjects();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteSubject = async (id: string, name: string) => handleSoftDelete(`/api/subjects/${id}`, `môn ${name}`, fetchSubjects);
  const openSubjectEdit = (sub: any) => {
    setIsSubjectEdit(true);
    setEditSubjectId(sub._id);
    setSubjectForm({ code: sub.code, name: sub.name, description: sub.description || "", status: sub.status || ACTIVE_STATUS });
    setIsSubjectModalOpen(true);
  };

  const openSubjectAdd = () => {
    setIsSubjectEdit(false);
    setEditSubjectId(null);
    setSubjectForm({ code: "", name: "", description: "", status: ACTIVE_STATUS });
    setIsSubjectModalOpen(true);
  };

  if (!user) return <div className="min-h-screen bg-[#f4f5fb] p-10 text-center font-bold text-slate-500">Đang tải...</div>;

  // LỌC DỮ LIỆU TÌM KIẾM BẢNG KHÁC
  const filteredUsers = usersData.filter((u) => (u.name + u.email + u.phone + (u.username || "")).toLowerCase().includes(userSearch.toLowerCase()));
  const filteredMajors = majorsData.filter((m) => (m.name + m.code).toLowerCase().includes(majorSearch.toLowerCase()));
  const filteredSubjects = subjectsData.filter((s) => (s.name + s.code).toLowerCase().includes(subjectSearch.toLowerCase()));

  // ================= LOGIC LỌC LỚP HỌC =================
  const filteredClasses = classesData.filter((c) => {
    const matchText = (c.name + c.subject + c.instructor + c.room + (c.description || "")).toLowerCase().includes(classSearch.toLowerCase());
    const matchSubject = filterSubject === "" || c.subject === filterSubject;
    const matchMajor = filterMajor === "" || c.major === filterMajor;
    const matchInstructor = filterInstructor === "" || c.instructor === filterInstructor;
    const matchShift = filterShift === "" || c.shift === filterShift;
    const matchStatus = filterStatus === "" || (filterStatus === ACTIVE_STATUS ? isActiveStatus(c.status) : c.status === filterStatus);

    return matchText && matchSubject && matchMajor && matchInstructor && matchShift && matchStatus;
  });

  const clearClassFilters = () => {
    setClassSearch("");
    setFilterSubject("");
    setFilterMajor("");
    setFilterInstructor("");
    setFilterShift("");
    setFilterStatus("");
  };

  const instructors = usersData.filter((u) => u.role === "instructor");
  const studentsList = usersData.filter((u) => u.role === "student");
  const currentUserId = user.id || user._id;
  const activeTabLabel =
    activeTab === "overview"
      ? "Tổng quan"
      : activeTab === "users"
        ? "Tài khoản"
        : activeTab === "majors"
          ? "Chuyên ngành"
          : activeTab === "subjects"
            ? "Môn học"
            : activeTab === "classes"
              ? "Lớp học"
              : "Thông tin cá nhân";

  const activeUsers = usersData.filter((item) => isActiveStatus(item.status)).length;
  const totalStudents = usersData.filter((item) => item.role === "student").length;
  const totalInstructors = usersData.filter((item) => item.role === "instructor").length;
  const activeClasses = classesData.filter((item) => isActiveStatus(item.status)).length;
  const activeMajors = majorsData.filter((item) => isActiveStatus(item.status)).length;
  const activeSubjects = subjectsData.filter((item) => isActiveStatus(item.status)).length;
  const totalCapacity = classesData.reduce((sum, cls) => sum + (Number(cls.maxStudents) || 0), 0);
  const assignedStudents = classesData.reduce((sum, cls) => sum + (Array.isArray(cls.students) ? cls.students.length : 0), 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((assignedStudents / totalCapacity) * 100) : 0;
  const recentClasses = [...classesData]
    .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime())
    .slice(0, 5);
  const recentUsers = [...usersData]
    .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime())
    .slice(0, 6);

  const inputClass =
    "rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100";
  const primaryButtonClass =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700";
  const secondaryButtonClass =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-extrabold text-violet-600 transition hover:bg-violet-50";
  const tableHeadClass = "bg-slate-50 text-xs uppercase text-slate-500";
  const tableCellClass = "px-5 py-4";
  const actionButtonClass = "inline-flex items-center gap-1.5 text-sm font-extrabold transition";

  return (
    <div className="admin-dashboard min-h-screen bg-[#f4f5fb] text-slate-800">
      <aside className="border-b border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-72 lg:border-b-0 lg:border-r">
        <div className="flex h-20 items-center gap-3 px-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <Icon name="logo" className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase text-violet-500">Hệ thống quản lý</p>
            <h1 className="truncate text-lg font-black text-slate-800">E-LEARNING LMS</h1>
          </div>
        </div>

        <nav className="grid gap-4 px-4 pb-4 md:grid-cols-3 lg:block lg:space-y-6 lg:pb-0">
          <div className="space-y-2">
            <SidebarItem icon="overview" label="Tổng quan" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
          </div>

          <div className="space-y-2">
            <p className="px-3 text-[11px] font-black uppercase text-slate-400">Quản lý</p>
            <SidebarItem icon="users" label="Tài khoản" active={activeTab === "users"} onClick={() => setActiveTab("users")} />
            <SidebarItem icon="majors" label="Chuyên ngành" active={activeTab === "majors"} onClick={() => setActiveTab("majors")} />
            <SidebarItem icon="subjects" label="Môn học" active={activeTab === "subjects"} onClick={() => setActiveTab("subjects")} />
            <SidebarItem icon="classes" label="Lớp học" active={activeTab === "classes"} onClick={() => setActiveTab("classes")} />
          </div>

          <div className="space-y-2">
            <p className="px-3 text-[11px] font-black uppercase text-slate-400">Tài khoản</p>
            <SidebarItem icon="profile" label="Thông tin cá nhân" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} />
          </div>
        </nav>

        <div className="hidden border-t border-slate-100 p-4 lg:block">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-extrabold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <Icon name="logout" className="h-4 w-4" />
            Đăng Xuất
          </button>
        </div>
      </aside>

      <main className="lg:ml-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#f4f5fb]/95 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500">
                Quản trị <span className="mx-1 text-slate-300">/</span> <span className="text-slate-800">{activeTabLabel}</span>
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-800">{activeTabLabel}</h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => router.push("/")} className={secondaryButtonClass}>
                <Icon name="home" className="h-4 w-4" />
                Trang Chủ
              </button>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-50 text-sm font-black text-violet-600">
                  <Icon name="profile" className="h-4 w-4" />
                </span>
                <span className="max-w-[220px] truncate text-sm font-bold text-slate-600">{user.email || user.name}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-extrabold text-rose-500 transition hover:bg-rose-50"
              >
                <Icon name="logout" className="h-4 w-4" />
                Đăng Xuất
              </button>
            </div>
          </div>
        </header>

        <section className="space-y-5 p-4 md:p-8">
          {activeTab === "overview" && (
            <>
              <div className="flex items-center gap-3 rounded-none bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-600 ring-1 ring-emerald-100">
                <Icon name="check" className="h-5 w-5 shrink-0" />
                Đăng nhập thành công. Xin chào {user.name}.
              </div>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)] md:p-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase text-violet-500">Hệ thống quản lý</p>
                    <h3 className="mt-5 text-3xl font-black text-slate-800 md:text-4xl">Tổng quan quản trị</h3>
                    <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                      Theo dõi tài khoản, chuyên ngành, môn học, lớp học và tình hình hệ thống.
                    </p>
                  </div>
                  <button type="button" onClick={refreshAllData} disabled={isRefreshing} className={primaryButtonClass}>
                    <Icon name="refresh" className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    {isRefreshing ? "Đang làm mới" : "Làm Mới"}
                  </button>
                </div>
              </section>

              <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <StatCard icon="users" label="Tài khoản" value={usersData.length} note={`${activeUsers} hoạt động`} tone="violet" />
                <StatCard icon="subjects" label="Môn học" value={subjectsData.length} note={`${activeSubjects} hoạt động`} tone="sky" />
                <StatCard icon="classes" label="Lớp học" value={classesData.length} note={`${activeClasses} hoạt động`} tone="amber" />
                <StatCard icon="majors" label="Chuyên ngành" value={majorsData.length} note={`${activeMajors} hoạt động`} tone="emerald" />
              </section>

              <section className="grid gap-5 xl:grid-cols-[0.95fr_1.45fr]">
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                  <h3 className="text-lg font-black text-slate-700">Chỉ số vận hành</h3>
                  <div className="mt-6 space-y-5">
                    <OverviewMetric icon="users" label="Sinh viên" detail="Tài khoản học sinh" value={totalStudents} tone="bg-violet-50 text-violet-600" />
                    <OverviewMetric icon="profile" label="Giảng viên" detail="Tài khoản giảng dạy" value={totalInstructors} tone="bg-sky-50 text-sky-600" />
                    <OverviewMetric icon="classes" label="Sĩ số đã xếp" detail={`Tổng sức chứa ${totalCapacity}`} value={`${occupancyRate}%`} tone="bg-emerald-50 text-emerald-600" />
                    <OverviewMetric icon="majors" label="Lớp có giảng viên" detail="Đã gán người phụ trách" value={classesData.filter((cls) => cls.instructor).length} tone="bg-amber-50 text-amber-600" />
                  </div>
                </article>

                <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
                    <h3 className="text-lg font-black text-slate-700">Lớp học gần đây</h3>
                    <button type="button" onClick={() => setActiveTab("classes")} className={secondaryButtonClass}>
                      Xem tất cả
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className={tableHeadClass}>
                        <tr>
                          <th className="px-5 py-4">Tên lớp</th>
                          <th className="px-5 py-4">Môn học</th>
                          <th className="px-5 py-4">Giảng viên</th>
                          <th className="px-5 py-4">Sĩ số</th>
                          <th className="px-5 py-4">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentClasses.map((cls) => (
                          <tr key={cls._id} className="hover:bg-slate-50/70">
                            <td className="px-5 py-4 font-extrabold text-slate-800">{cls.name}</td>
                            <td className="px-5 py-4 font-semibold text-slate-500">{cls.subject || "-"}</td>
                            <td className="px-5 py-4 font-semibold text-slate-500">{cls.instructor || "-"}</td>
                            <td className="px-5 py-4 font-bold text-slate-600">
                              {Array.isArray(cls.students) ? cls.students.length : 0}/{cls.maxStudents || 0}
                            </td>
                            <td className="px-5 py-4">
                              <StatusBadge status={cls.status} />
                            </td>
                          </tr>
                        ))}
                        {recentClasses.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-5 py-12 text-center text-sm font-bold text-slate-400">
                              Chưa có lớp học nào.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>
              </section>

              <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
                  <h3 className="text-lg font-black text-slate-700">Tài khoản mới</h3>
                  <button type="button" onClick={() => setActiveTab("users")} className={secondaryButtonClass}>
                    Quản lý tài khoản
                  </button>
                </div>
                <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
                  {recentUsers.map((item) => (
                    <div key={item._id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-violet-600 shadow-sm">
                        {getInitials(item.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-slate-700">{item.name}</p>
                        <p className="truncate text-xs font-semibold text-slate-400">{item.email}</p>
                      </div>
                      <span className={`rounded-full border px-2 py-1 text-[11px] font-black ${getRoleBadgeClass(item.role)}`}>{getRoleLabel(item.role)}</span>
                    </div>
                  ))}
                  {recentUsers.length === 0 && <p className="text-sm font-bold text-slate-400">Chưa có tài khoản nào.</p>}
                </div>
              </article>
            </>
          )}

          {activeTab === "classes" && (
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
              <div className="space-y-4 border-b border-slate-100 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase text-violet-500">Quản lý dữ liệu</p>
                    <h3 className="mt-1 text-xl font-black text-slate-800">Quản lý lớp học</h3>
                  </div>
                  <button type="button" onClick={openClassAdd} className={primaryButtonClass}>
                    <Icon name="plus" className="h-4 w-4" />
                    Thêm lớp học
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                  <div className="relative md:col-span-2 xl:col-span-2">
                    <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo tên lớp, mô tả..."
                      value={classSearch}
                      onChange={(e) => setClassSearch(e.target.value)}
                      className={`${inputClass} w-full pl-9`}
                    />
                  </div>
                  <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className={inputClass}>
                    <option value="">Chọn môn học</option>
                    {subjectsData.map((s) => (
                      <option key={s._id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <select value={filterMajor} onChange={(e) => setFilterMajor(e.target.value)} className={inputClass}>
                    <option value="">Chọn chuyên ngành</option>
                    {majorsData.map((m) => (
                      <option key={m._id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <select value={filterInstructor} onChange={(e) => setFilterInstructor(e.target.value)} className={inputClass}>
                    <option value="">Chọn giáo viên</option>
                    {instructors.map((i) => (
                      <option key={i._id} value={i.name}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                  <select value={filterShift} onChange={(e) => setFilterShift(e.target.value)} className={inputClass}>
                    <option value="">Chọn ca học</option>
                    <option value="Ca 1 (07:15-09:15)">Ca 1</option>
                    <option value="Ca 2 (09:20-11:20)">Ca 2</option>
                    <option value="Ca 3 (12:00-14:00)">Ca 3</option>
                    <option value="Ca 4 (14:10-16:10)">Ca 4</option>
                    <option value="Ca 5 (16:20-18:20)">Ca 5</option>
                    <option value="Ca 6 (18:30-20:30)">Ca 6</option>
                  </select>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={inputClass}>
                    <option value="">Trạng thái</option>
                    <option value={ACTIVE_STATUS}>Hoạt động</option>
                    <option value={INACTIVE_STATUS}>Ngừng hoạt động</option>
                  </select>
                </div>

                {(classSearch || filterSubject || filterMajor || filterInstructor || filterShift || filterStatus) && (
                  <button type="button" onClick={clearClassFilters} className="text-sm font-extrabold text-rose-500 hover:underline">
                    Xóa bộ lọc
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className={tableHeadClass}>
                    <tr>
                      <th className={tableCellClass}>Tên lớp</th>
                      <th className={tableCellClass}>Môn học</th>
                      <th className={tableCellClass}>Chuyên ngành</th>
                      <th className={tableCellClass}>Giáo viên</th>
                      <th className={tableCellClass}>Ngày bắt đầu</th>
                      <th className={tableCellClass}>Trạng thái</th>
                      <th className={`${tableCellClass} text-center`}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClasses.map((cls) => (
                      <tr key={cls._id} className="hover:bg-slate-50/70">
                        <td className={`${tableCellClass} font-black text-slate-800`}>{cls.name}</td>
                        <td className={tableCellClass}>{cls.subject}</td>
                        <td className={`${tableCellClass} text-slate-500`}>{cls.major}</td>
                        <td className={`${tableCellClass} font-extrabold text-violet-600`}>{cls.instructor}</td>
                        <td className={tableCellClass}>{cls.startDate || "-"}</td>
                        <td className={tableCellClass}>
                          <StatusBadge status={cls.status} />
                        </td>
                        <td className={`${tableCellClass} text-center`}>
                          <div className="flex justify-center gap-3">
                            <button type="button" onClick={() => openClassDetail(cls)} className={`${actionButtonClass} text-violet-600 hover:text-violet-800`}>
                              <Icon name="eye" className="h-4 w-4" />
                              Chi tiết
                            </button>
                            <button type="button" onClick={() => openClassEdit(cls)} className={`${actionButtonClass} text-slate-500 hover:text-violet-700`}>
                              <Icon name="edit" className="h-4 w-4" />
                              Sửa
                            </button>
                            <button type="button" onClick={() => deleteClass(cls._id, cls.name)} className={`${actionButtonClass} text-rose-500 hover:text-rose-700`}>
                              <Icon name="trash" className="h-4 w-4" />
                              Ẩn
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredClasses.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center text-sm font-bold text-slate-400">
                          Chưa có dữ liệu phù hợp với bộ lọc.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          )}

          {activeTab === "users" && (
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-xs font-black uppercase text-violet-500">Quản lý dữ liệu</p>
                  <h3 className="mt-1 text-xl font-black text-slate-800">Quản lý người dùng</h3>
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="relative">
                    <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên, mã số, email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className={`${inputClass} w-full pl-9 md:w-72`}
                    />
                  </div>
                  <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className={secondaryButtonClass}>
                    <Icon name="upload" className="h-4 w-4" />
                    Nạp Excel
                  </button>
                  <button type="button" onClick={openUserAdd} className={primaryButtonClass}>
                    <Icon name="plus" className="h-4 w-4" />
                    Thêm người dùng
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead className={tableHeadClass}>
                    <tr>
                      <th className={tableCellClass}>Mã số</th>
                      <th className={tableCellClass}>Họ tên</th>
                      <th className={tableCellClass}>Email</th>
                      <th className={tableCellClass}>SĐT</th>
                      <th className={tableCellClass}>Vai trò</th>
                      <th className={`${tableCellClass} text-center`}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((usr) => (
                      <tr key={usr._id} className="hover:bg-slate-50/70">
                        <td className={`${tableCellClass} font-black text-violet-700`}>{usr.username || `CF${usr._id.substring(18, 24).toUpperCase()}`}</td>
                        <td className={`${tableCellClass} font-extrabold text-slate-800`}>{usr.name}</td>
                        <td className={tableCellClass}>{usr.email}</td>
                        <td className={tableCellClass}>{usr.phone || "-"}</td>
                        <td className={tableCellClass}>
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold ${getRoleBadgeClass(usr.role)}`}>{getRoleLabel(usr.role)}</span>
                        </td>
                        <td className={`${tableCellClass} text-center`}>
                          <div className="flex justify-center gap-3">
                            <button type="button" onClick={() => openUserEdit(usr)} className={`${actionButtonClass} text-slate-500 hover:text-violet-700`} title="Sửa">
                              <Icon name="edit" className="h-4 w-4" />
                            </button>
                            {currentUserId !== usr._id && (
                              <button
                                type="button"
                                title="Ẩn người dùng"
                                onClick={() => deleteUser(usr._id, usr.name)}
                                className={`${actionButtonClass} text-rose-500 hover:text-rose-700`}
                              >
                                <Icon name="trash" className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-sm font-bold text-slate-400">
                          Chưa có người dùng phù hợp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          )}

          {activeTab === "majors" && (
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase text-violet-500">Quản lý dữ liệu</p>
                  <h3 className="mt-1 text-xl font-black text-slate-800">Quản lý chuyên ngành</h3>
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="relative">
                    <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Tìm kiếm chuyên ngành..." value={majorSearch} onChange={(e) => setMajorSearch(e.target.value)} className={`${inputClass} w-full pl-9 md:w-72`} />
                  </div>
                  <button type="button" onClick={openMajorAdd} className={primaryButtonClass}>
                    <Icon name="plus" className="h-4 w-4" />
                    Thêm chuyên ngành
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className={tableHeadClass}>
                    <tr>
                      <th className={tableCellClass}>Mã</th>
                      <th className={tableCellClass}>Tên chuyên ngành</th>
                      <th className={tableCellClass}>Mô tả chi tiết</th>
                      <th className={tableCellClass}>Trạng thái</th>
                      <th className={`${tableCellClass} text-right`}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMajors.map((mjr) => (
                      <tr key={mjr._id} className="hover:bg-slate-50/70">
                        <td className={`${tableCellClass} font-black text-slate-800`}>{mjr.code}</td>
                        <td className={`${tableCellClass} font-extrabold text-slate-700`}>{mjr.name}</td>
                        <td className={`${tableCellClass} max-w-xs truncate text-slate-500`}>{mjr.description || "-"}</td>
                        <td className={tableCellClass}>
                          <StatusBadge status={mjr.status} />
                        </td>
                        <td className={`${tableCellClass} text-right`}>
                          <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => openMajorEdit(mjr)} className={`${actionButtonClass} text-slate-500 hover:text-violet-700`} title="Sửa">
                              <Icon name="edit" className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Ẩn chuyên ngành"
                              onClick={() => deleteMajor(mjr._id, mjr.name)}
                              className={`${actionButtonClass} text-rose-500 hover:text-rose-700`}
                            >
                              <Icon name="trash" className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredMajors.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-sm font-bold text-slate-400">
                          Chưa có chuyên ngành phù hợp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          )}

          {activeTab === "subjects" && (
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase text-violet-500">Quản lý dữ liệu</p>
                  <h3 className="mt-1 text-xl font-black text-slate-800">Quản lý môn học</h3>
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="relative">
                    <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Tìm kiếm môn học..." value={subjectSearch} onChange={(e) => setSubjectSearch(e.target.value)} className={`${inputClass} w-full pl-9 md:w-72`} />
                  </div>
                  <button type="button" onClick={openSubjectAdd} className={primaryButtonClass}>
                    <Icon name="plus" className="h-4 w-4" />
                    Thêm môn học
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className={tableHeadClass}>
                    <tr>
                      <th className={tableCellClass}>Mã</th>
                      <th className={tableCellClass}>Tên môn học</th>
                      <th className={tableCellClass}>Mô tả</th>
                      <th className={tableCellClass}>Trạng thái</th>
                      <th className={`${tableCellClass} text-right`}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSubjects.map((sub) => (
                      <tr key={sub._id} className="hover:bg-slate-50/70">
                        <td className={`${tableCellClass} font-black text-slate-800`}>{sub.code}</td>
                        <td className={`${tableCellClass} font-extrabold text-slate-700`}>{sub.name}</td>
                        <td className={`${tableCellClass} max-w-xs truncate text-slate-500`}>{sub.description || "-"}</td>
                        <td className={tableCellClass}>
                          <StatusBadge status={sub.status} />
                        </td>
                        <td className={`${tableCellClass} text-right`}>
                          <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => openSubjectEdit(sub)} className={`${actionButtonClass} text-slate-500 hover:text-violet-700`} title="Sửa">
                              <Icon name="edit" className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Ẩn môn học"
                              onClick={() => deleteSubject(sub._id, sub.name)}
                              className={`${actionButtonClass} text-rose-500 hover:text-rose-700`}
                            >
                              <Icon name="trash" className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredSubjects.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-sm font-bold text-slate-400">
                          Chưa có môn học phù hợp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          )}

          {activeTab === "profile" && (
            <div className="rounded-2xl">
              <ProfileSettings />
            </div>
          )}
        </section>
      </main>

      {/* ================= MODAL LỚP HỌC ================= */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="text-lg font-black text-slate-800">{isClassEdit ? "Cập nhật lớp học" : "Thêm lớp học"}</h3>
              <button type="button" onClick={() => setIsClassModalOpen(false)} className="text-2xl font-black text-slate-400 hover:text-rose-500">
                &times;
              </button>
            </div>

            <form id="classForm" onSubmit={handleClassSubmit} className="space-y-5 overflow-y-auto p-6 text-sm">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="font-extrabold text-slate-700">* Tên lớp học</span>
                  <input
                    type="text"
                    placeholder="Nhập tên lớp học"
                    required
                    value={classForm.name}
                    onChange={(e) => setClassForm({ ...classForm, name: e.target.value.toUpperCase() })}
                    className={`${inputClass} w-full uppercase`}
                    disabled={isClassEdit}
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="font-extrabold text-slate-700">* Môn học</span>
                  <select required value={classForm.subject} onChange={(e) => setClassForm({ ...classForm, subject: e.target.value })} className={`${inputClass} w-full`}>
                    <option value="">Chọn môn học</option>
                    {subjectsData.map((s) => (
                      <option key={s._id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="font-extrabold text-slate-700">* Chuyên ngành</span>
                  <select required value={classForm.major} onChange={(e) => setClassForm({ ...classForm, major: e.target.value })} className={`${inputClass} w-full`}>
                    <option value="">Chọn chuyên ngành</option>
                    {majorsData.map((m) => (
                      <option key={m._id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="font-extrabold text-slate-700">* Giáo viên</span>
                  <select required value={classForm.instructor} onChange={(e) => setClassForm({ ...classForm, instructor: e.target.value })} className={`${inputClass} w-full`}>
                    <option value="">Chọn giáo viên</option>
                    {instructors.map((i) => (
                      <option key={i._id} value={i.name}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="font-extrabold text-slate-700">* Ngày bắt đầu</span>
                  <input type="date" required value={classForm.startDate} onChange={(e) => setClassForm({ ...classForm, startDate: e.target.value })} className={`${inputClass} w-full`} />
                </label>
                <label className="space-y-1.5">
                  <span className="font-extrabold text-slate-700">* Ca học</span>
                  <select required value={classForm.shift} onChange={(e) => setClassForm({ ...classForm, shift: e.target.value })} className={`${inputClass} w-full`}>
                    <option value="">Chọn ca học</option>
                    <option value="Ca 1 (07:15-09:15)">Ca 1 (07:15-09:15)</option>
                    <option value="Ca 2 (09:20-11:20)">Ca 2 (09:20-11:20)</option>
                    <option value="Ca 3 (12:00-14:00)">Ca 3 (12:00-14:00)</option>
                    <option value="Ca 4 (14:10-16:10)">Ca 4 (14:10-16:10)</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <label className="space-y-1.5">
                  <span className="font-extrabold text-slate-700">* Số buổi học</span>
                  <input type="number" placeholder="15" value={classForm.totalSessions} onChange={(e) => setClassForm({ ...classForm, totalSessions: e.target.value })} className={`${inputClass} w-full`} />
                </label>
                <label className="space-y-1.5">
                  <span className="font-extrabold text-slate-700">* Sĩ số tối đa</span>
                  <input type="number" placeholder="30" value={classForm.maxStudents} onChange={(e) => setClassForm({ ...classForm, maxStudents: e.target.value })} className={`${inputClass} w-full`} />
                </label>
                <label className="space-y-1.5">
                  <span className="font-extrabold text-slate-700">* Phòng học</span>
                  <input type="text" placeholder="B201" value={classForm.room} onChange={(e) => setClassForm({ ...classForm, room: e.target.value })} className={`${inputClass} w-full`} />
                </label>
              </div>

              <div>
                <p className="mb-2 font-extrabold text-slate-700">* Ngày học trong tuần</p>
                <div className="flex flex-wrap gap-3">
                  {["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"].map((day) => (
                    <label key={day} className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 hover:border-violet-200 hover:bg-violet-50">
                      <input type="checkbox" checked={classForm.scheduleDays.includes(day)} onChange={() => toggleDay(day)} className="h-4 w-4 accent-violet-600" />
                      <span>{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 font-extrabold text-slate-700">Sinh viên tham gia (tùy chọn)</p>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-sm font-extrabold text-violet-600">
                    Sinh viên: {classForm.students.length}/{classForm.maxStudents || 0}
                  </div>

                  <div className="mb-3 flex flex-col gap-3 md:flex-row">
                    <input
                      type="text"
                      placeholder="Nhập nhanh tên sinh viên..."
                      value={studentInput}
                      onChange={(e) => setStudentInput(e.target.value)}
                      className={`${inputClass} w-full bg-white`}
                    />
                    <button type="button" onClick={handleAddStudent} className={primaryButtonClass}>
                      <Icon name="plus" className="h-4 w-4" />
                      Thêm
                    </button>
                  </div>

                  <div className="relative">
                    <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm và chọn sinh viên..."
                      value={studentSearchInput}
                      onChange={(e) => {
                        setStudentSearchInput(e.target.value);
                        setShowStudentDropdown(true);
                      }}
                      onFocus={() => setShowStudentDropdown(true)}
                      onBlur={() => setTimeout(() => setShowStudentDropdown(false), 200)}
                      className={`${inputClass} w-full bg-white pl-9`}
                    />
                    {showStudentDropdown && (
                      <div className="absolute z-10 mt-2 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                        {studentsList
                          .filter((s) => s.name.toLowerCase().includes(studentSearchInput.toLowerCase()) || (s.username && s.username.toLowerCase().includes(studentSearchInput.toLowerCase())))
                          .map((stu) => (
                            <button
                              type="button"
                              key={stu._id}
                              className="flex w-full items-center justify-between gap-3 border-b border-slate-50 px-3 py-2.5 text-left transition hover:bg-violet-50"
                              onClick={() => handleSelectStudentFromDropdown(stu.name)}
                            >
                              <span className="font-extrabold text-slate-800">{stu.name}</span>
                              <span className="text-xs font-bold text-slate-400">{stu.username || stu.email}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  {classForm.students.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {classForm.students.map((stu, index) => (
                        <div key={`${stu}-${index}`} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-600 shadow-sm">
                          {stu}
                          <button type="button" onClick={() => removeStudent(index)} className="text-base leading-none text-rose-500 hover:text-rose-700">
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <label className="block space-y-1.5">
                <span className="font-extrabold text-slate-700">Link học online (tùy chọn)</span>
                <input type="text" placeholder="Nhập link học online" value={classForm.onlineLink} onChange={(e) => setClassForm({ ...classForm, onlineLink: e.target.value })} className={`${inputClass} w-full`} />
              </label>
              <label className="block space-y-1.5">
                <span className="font-extrabold text-slate-700">Mô tả</span>
                <textarea placeholder="Nhập mô tả lớp học" rows={3} value={classForm.description} onChange={(e) => setClassForm({ ...classForm, description: e.target.value })} className={`${inputClass} w-full resize-none`} />
              </label>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsClassModalOpen(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-extrabold text-slate-600 hover:bg-slate-50">
                  Hủy
                </button>
                <button type="submit" form="classForm" className={primaryButtonClass}>
                  {isClassEdit ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL CHI TIẾT LỚP HỌC ================= */}
      {isClassDetailModalOpen && selectedClassDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="flex items-center gap-2 text-lg font-black text-slate-800">
                <Icon name="classes" className="h-5 w-5 text-violet-600" />
                Chi tiết lớp học
              </h3>
              <button type="button" onClick={() => setIsClassDetailModalOpen(false)} className="text-2xl font-black text-slate-400 hover:text-rose-500">
                &times;
              </button>
            </div>

            <div className="overflow-y-auto p-6 md:p-8">
              <h2 className="mb-6 text-3xl font-black text-violet-600">{selectedClassDetail.name}</h2>
              <div className="mb-8 grid gap-4 text-sm md:grid-cols-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Môn học</span>
                  <span className="font-extrabold text-slate-800">{selectedClassDetail.subject}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Chuyên ngành</span>
                  <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-black text-violet-600">{selectedClassDetail.major}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Giáo viên</span>
                  <span className="font-extrabold text-slate-800">{selectedClassDetail.instructor}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Ca học</span>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-600">{selectedClassDetail.shift || "-"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Ngày học</span>
                  <span className="font-extrabold text-emerald-600">{selectedClassDetail.scheduleDays?.join(", ") || selectedClassDetail.days || "-"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Phòng học</span>
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-black text-sky-600">{selectedClassDetail.room || "-"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Ngày bắt đầu</span>
                  <span className="font-extrabold text-slate-800">{selectedClassDetail.startDate || "-"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Số buổi học</span>
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-black text-cyan-600">{selectedClassDetail.totalSessions || 0} buổi</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Sĩ số</span>
                  <span className="font-black text-violet-600">
                    {selectedClassDetail.students?.length || 0} / {selectedClassDetail.maxStudents || 0} sinh viên
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Trạng thái</span>
                  <StatusBadge status={selectedClassDetail.status} />
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Ngày tạo</span>
                  <span className="font-semibold text-slate-600">{formatDate(selectedClassDetail.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Cập nhật lần cuối</span>
                  <span className="font-semibold text-slate-600">{formatDate(selectedClassDetail.updatedAt)}</span>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="mb-2 font-black text-slate-800">Mô tả</h4>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">{selectedClassDetail.description || "Không có mô tả."}</div>
              </div>

              <div>
                <h4 className="mb-4 font-black text-slate-800">Danh sách sinh viên ({selectedClassDetail.students?.length || 0})</h4>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="max-h-60 overflow-y-auto">
                    {!selectedClassDetail.students || selectedClassDetail.students.length === 0 ? (
                      <div className="bg-slate-50 p-4 text-center text-sm font-bold text-slate-400">Lớp học chưa có sinh viên nào.</div>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {selectedClassDetail.students.map((studentName: string, index: number) => {
                          const studentInfo = usersData.find((u) => u.name === studentName);
                          return (
                            <li key={`${studentName}-${index}`} className="flex items-center gap-4 p-4 transition hover:bg-slate-50">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-50 font-black text-violet-600">{getInitials(studentName)}</div>
                              <div>
                                <div className="text-sm font-black text-slate-800">
                                  <span className="mr-1 font-semibold text-slate-400">{index + 1}.</span>
                                  {studentName}
                                  {studentInfo?.username && <span className="ml-2 rounded-full bg-violet-50 px-2 py-0.5 text-xs text-violet-600">{studentInfo.username}</span>}
                                </div>
                                <div className="mt-0.5 text-xs font-semibold text-slate-400">{studentInfo?.email || "N/A"}</div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= CÁC MODAL ẨN KHÁC ================= */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-black text-slate-800">{isUserEdit ? "Sửa" : "Thêm"} người dùng</h3>
            <form onSubmit={handleUserSubmit} className="space-y-3">
              <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className={`${inputClass} w-full`}>
                <option value="student">Học sinh</option>
                <option value="instructor">Giảng viên</option>
                <option value="admin">Admin</option>
              </select>

              {userForm.role === "student" && (
                <select value={userForm.major} onChange={(e) => setUserForm({ ...userForm, major: e.target.value })} className={`${inputClass} w-full`}>
                  <option value="">-- Chọn chuyên ngành --</option>
                  {majorsData.map((m) => (
                    <option key={m._id} value={m.name}>
                      {m.name} ({m.code})
                    </option>
                  ))}
                </select>
              )}

              <input placeholder="Mã số (Để trống tự tạo ngẫu nhiên)" disabled={isUserEdit} value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} className={`${inputClass} w-full disabled:bg-slate-50`} />
              <input placeholder="Họ tên" required value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} className={`${inputClass} w-full`} />
              <input type="email" placeholder="Email" required disabled={isUserEdit} value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} className={`${inputClass} w-full disabled:bg-slate-50`} />
              <input type="tel" placeholder="SĐT" value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} className={`${inputClass} w-full`} />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-600 hover:bg-slate-50">
                  Hủy
                </button>
                <button type="submit" className={primaryButtonClass}>
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMajorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-black text-slate-800">{isMajorEdit ? "Sửa" : "Thêm"} chuyên ngành</h3>
            <form onSubmit={handleMajorSubmit} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-black uppercase text-slate-500">Mã chuyên ngành</span>
                <input placeholder="VD: CNTT" required value={majorForm.code} onChange={(e) => setMajorForm({ ...majorForm, code: e.target.value.toUpperCase() })} className={`${inputClass} w-full uppercase`} disabled={isMajorEdit} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-black uppercase text-slate-500">Tên chuyên ngành</span>
                <input placeholder="Nhập tên chuyên ngành" required value={majorForm.name} onChange={(e) => setMajorForm({ ...majorForm, name: e.target.value })} className={`${inputClass} w-full`} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-black uppercase text-slate-500">Mô tả</span>
                <textarea placeholder="Nhập mô tả chuyên ngành" rows={4} value={majorForm.description} onChange={(e) => setMajorForm({ ...majorForm, description: e.target.value })} className={`${inputClass} w-full resize-none`} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-black uppercase text-slate-500">Trạng thái</span>
                <select value={majorForm.status} onChange={(e) => setMajorForm({ ...majorForm, status: e.target.value })} className={`${inputClass} w-full`}>
                  <option value={ACTIVE_STATUS}>Hoạt động</option>
                  <option value={INACTIVE_STATUS}>Ngừng hoạt động</option>
                </select>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsMajorModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-600 hover:bg-slate-50">
                  Hủy
                </button>
                <button type="submit" className={primaryButtonClass}>
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-black text-slate-800">{isSubjectEdit ? "Sửa" : "Thêm"} môn học</h3>
            <form onSubmit={handleSubjectSubmit} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-black uppercase text-slate-500">Mã môn học</span>
                <input placeholder="VD: WEB101" required value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })} className={`${inputClass} w-full uppercase`} disabled={isSubjectEdit} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-black uppercase text-slate-500">Tên môn học</span>
                <input placeholder="Nhập tên môn học" required value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} className={`${inputClass} w-full`} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-black uppercase text-slate-500">Mô tả</span>
                <textarea placeholder="Nhập mô tả môn học" rows={4} value={subjectForm.description} onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })} className={`${inputClass} w-full resize-none`} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-black uppercase text-slate-500">Trạng thái</span>
                <select value={subjectForm.status} onChange={(e) => setSubjectForm({ ...subjectForm, status: e.target.value })} className={`${inputClass} w-full`}>
                  <option value={ACTIVE_STATUS}>Hoạt động</option>
                  <option value={INACTIVE_STATUS}>Ngừng hoạt động</option>
                </select>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsSubjectModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-600 hover:bg-slate-50">
                  Hủy
                </button>
                <button type="submit" className={primaryButtonClass}>
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
