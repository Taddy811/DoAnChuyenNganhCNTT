/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";

type InstructorAssignmentsProps = {
  user: any;
  myClasses: any[];
  usersData: any[];
};

type AssignmentForm = {
  title: string;
  description: string;
  classId: string;
  subject: string;
  dueAt: string;
  maxScore: string;
  status: "open" | "closed";
};

const emptyForm: AssignmentForm = {
  title: "",
  description: "",
  classId: "",
  subject: "",
  dueAt: "",
  maxScore: "10",
  status: "open",
};

const formatDateTime = (value?: string) => {
  if (!value) return "Chưa đặt";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toInputDateTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const isOverdue = (assignment: any) => new Date(assignment.dueAt).getTime() < Date.now();

const getSubmissionForStudent = (assignment: any, student: any) => (
  assignment?.submissions?.find((submission: any) => (
    !submission.isDeleted
    && submission.status === "submitted"
    && (
      submission.studentName === student.name
      || (student.username && submission.studentUsername === student.username)
    )
  ))
);

const fileHref = (url?: string) => url || "#";

function StatusBadge({ status, overdue }: { status: string; overdue?: boolean }) {
  const label = status === "closed" ? "Đã đóng" : overdue ? "Quá hạn" : "Đang mở";
  const cls = status === "closed" || overdue
    ? "bg-red-50 text-red-600 border-red-100"
    : "bg-emerald-50 text-emerald-700 border-emerald-100";

  return <span className={`px-2.5 py-1 rounded-md text-xs font-extrabold border ${cls}`}>{label}</span>;
}

export default function InstructorAssignments({ user, myClasses, usersData }: InstructorAssignmentsProps) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [activeSection, setActiveSection] = useState<"list" | "create" | "submissions">("list");
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);
  const [form, setForm] = useState<AssignmentForm>(emptyForm);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | ""; text: string }>({ type: "", text: "" });
  const [gradeDrafts, setGradeDrafts] = useState<Record<string, { grade: string; feedback: string }>>({});

  const filteredAssignments = useMemo(() => {
    const source = selectedClassId
      ? assignments.filter((assignment) => assignment.classId === selectedClassId)
      : assignments;

    return source.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }, [assignments, selectedClassId]);

  const submissionRows = selectedAssignment?.classStudents?.map((student: any, index: number) => {
    const submission = getSubmissionForStudent(selectedAssignment, student);
    const studentInfo = usersData.find((item: any) => item.name === student.name || item.username === student.username);
    return {
      index,
      student: { ...student, username: student.username || studentInfo?.username || "", email: student.email || studentInfo?.email || "" },
      submission,
    };
  }) || [];

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });
      const params = new URLSearchParams();
      if (user?.name) params.set("instructorName", user.name);
      if (user?._id || user?.id) params.set("instructorId", user._id || user.id);

      const res = await fetch(`/api/assignments?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Không thể tải bài tập.");
      setAssignments(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Không thể tải bài tập." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [user?.name]);

  useEffect(() => {
    if (!selectedAssignment) return;

    const fresh = assignments.find((assignment) => assignment._id === selectedAssignment._id);
    if (fresh) setSelectedAssignment(fresh);
  }, [assignments, selectedAssignment?._id]);

  useEffect(() => {
    if (!selectedAssignment) return;

    const drafts: Record<string, { grade: string; feedback: string }> = {};
    selectedAssignment.submissions?.forEach((submission: any) => {
      drafts[submission._id] = {
        grade: submission.grade === undefined || submission.grade === null ? "" : String(submission.grade),
        feedback: submission.feedback || "",
      };
    });
    setGradeDrafts(drafts);
  }, [selectedAssignment]);

  const openCreateModal = () => {
    const firstClass = selectedClassId || myClasses[0]?._id || "";
    const cls = myClasses.find((item) => item._id === firstClass);
    setEditingAssignment(null);
    setForm({
      ...emptyForm,
      classId: firstClass,
      subject: cls?.subject || "",
      dueAt: toInputDateTime(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
      maxScore: "7",
    });
    setAttachment(null);
    setActiveSection("create");
    setIsModalOpen(true);
  };

  const openEditModal = (assignment: any) => {
    setEditingAssignment(assignment);
    setForm({
      title: assignment.title || "",
      description: assignment.description || "",
      classId: assignment.classId || "",
      subject: assignment.subject || "",
      dueAt: toInputDateTime(assignment.dueAt),
      maxScore: String(assignment.maxScore ?? 10),
      status: assignment.status === "closed" ? "closed" : "open",
    });
    setAttachment(null);
    setIsModalOpen(true);
  };

  const handleClassChange = (classId: string) => {
    const cls = myClasses.find((item) => item._id === classId);
    setForm((prev) => ({ ...prev, classId, subject: cls?.subject || prev.subject }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    if (!form.title.trim() || !form.classId || !form.dueAt) {
      setMessage({ type: "error", text: "Vui lòng nhập tiêu đề, lớp học và hạn nộp." });
      return;
    }

    try {
      setActionLoading(true);
      const payload = new FormData();
      payload.append("title", form.title.trim());
      payload.append("description", form.description);
      payload.append("classId", form.classId);
      payload.append("subject", form.subject);
      payload.append("dueAt", new Date(form.dueAt).toISOString());
      payload.append("maxScore", form.maxScore);
      payload.append("status", form.status);
      payload.append("instructorName", user?.name || "");
      payload.append("instructorId", user?._id || user?.id || "");
      if (attachment) payload.append("attachment", attachment);

      const url = editingAssignment ? `/api/assignments/${editingAssignment._id}` : "/api/assignments";
      const res = await fetch(url, {
        method: editingAssignment ? "PUT" : "POST",
        body: payload,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Không thể lưu bài tập.");

      setMessage({ type: "success", text: data.message || "Lưu bài tập thành công." });
      setIsModalOpen(false);
      setActiveSection("list");
      await fetchAssignments();
      if (selectedAssignment?._id === data.assignment?._id) setSelectedAssignment(data.assignment);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Không thể lưu bài tập." });
    } finally {
      setActionLoading(false);
    }
  };

  const deleteAssignment = async (assignment: any) => {
    if (!confirm(`Ẩn bài tập "${assignment.title}" khỏi danh sách?\n\nDữ liệu sẽ được ẩn khỏi danh sách nhưng vẫn được lưu trong hệ thống để tra cứu lịch sử.`)) return;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/assignments/${assignment._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Không thể xóa bài tập.");

      setMessage({ type: "success", text: data.message || "Đã ẩn dữ liệu thành công." });
      if (selectedAssignment?._id === assignment._id) setSelectedAssignment(null);
      await fetchAssignments();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Không thể xóa bài tập." });
    } finally {
      setActionLoading(false);
    }
  };

  const openDetail = (assignment: any) => {
    setSelectedAssignment(assignment);
    setActiveSection("submissions");
  };

  const updateGrade = async (submission: any) => {
    const draft = gradeDrafts[submission._id] || { grade: "", feedback: "" };

    try {
      setActionLoading(true);
      const res = await fetch(`/api/assignments/${selectedAssignment._id}/submissions/${submission._id}/grade`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: draft.grade, feedback: draft.feedback }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Không thể cập nhật điểm.");

      setMessage({ type: "success", text: data.message || "Đã cập nhật điểm." });
      await fetchAssignments();
      if (data.assignment) setSelectedAssignment(data.assignment);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Không thể cập nhật điểm." });
    } finally {
      setActionLoading(false);
    }
  };

  if (selectedAssignment && activeSection === "submissions") {
    const stats = selectedAssignment.stats || {};
    const overdue = isOverdue(selectedAssignment);

    return (
      <div className="h-full overflow-y-auto bg-[#f4f5fb] p-0">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <button onClick={() => setSelectedAssignment(null)} className="text-sm font-bold text-violet-700 hover:text-violet-800 mb-2">
                ← Quay lại danh sách
              </button>
              <h2 className="text-2xl font-black text-gray-900">{selectedAssignment.title}</h2>
              <p className="text-sm font-semibold text-gray-500 mt-1">{selectedAssignment.className} · {selectedAssignment.subject}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={selectedAssignment.status} overdue={overdue} />
              <button onClick={() => openEditModal(selectedAssignment)} className="px-4 py-2 rounded-md border border-gray-200 bg-white text-gray-700 text-sm font-bold hover:bg-gray-50">
                Sửa
              </button>
            </div>
          </div>

          {message.text && (
            <div className={`rounded-lg border px-4 py-3 text-sm font-bold ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
            <section className="bg-white rounded-2xl border border-slate-200 shadow-[0_12px_28px_rgba(15,23,42,0.06)] overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-violet-600 to-indigo-500 text-white">
                <div className="text-xs font-bold text-violet-100 uppercase tracking-wide">Chi tiết bài tập</div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div><span className="text-white/60">Hạn nộp</span><div className="font-extrabold">{formatDateTime(selectedAssignment.dueAt)}</div></div>
                  <div><span className="text-white/60">Điểm tối đa</span><div className="font-extrabold">{selectedAssignment.maxScore}</div></div>
                  <div><span className="text-white/60">Ngày giao</span><div className="font-extrabold">{formatDateTime(selectedAssignment.createdAt)}</div></div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-extrabold text-gray-900 mb-2">Yêu cầu bài tập</h3>
                  <div className="whitespace-pre-wrap text-sm leading-6 text-gray-700 bg-gray-50 border border-gray-100 rounded-lg p-4">
                    {selectedAssignment.description || "Chưa có mô tả."}
                  </div>
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 mb-2">File đính kèm</h3>
                  {selectedAssignment.attachment?.url ? (
                    <a href={fileHref(selectedAssignment.attachment.url)} target="_blank" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-emerald-100 bg-emerald-50 text-emerald-700 text-sm font-bold hover:bg-emerald-100">
                      Mở file: {selectedAssignment.attachment.originalName}
                    </a>
                  ) : (
                    <div className="text-sm font-semibold text-gray-400">Không có file đính kèm.</div>
                  )}
                </div>
              </div>
            </section>

            <aside className="bg-white rounded-2xl border border-slate-200 shadow-[0_12px_28px_rgba(15,23,42,0.06)] overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-black text-gray-900">Thống kê nộp bài</h3>
              </div>
              <div className="p-5 grid grid-cols-3 xl:grid-cols-1 gap-3">
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                  <div className="text-xs font-bold text-emerald-700">Đã nộp</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">{stats.submittedCount || 0}</div>
                </div>
                <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                  <div className="text-xs font-bold text-red-600">Chưa nộp</div>
                  <div className="text-2xl font-black text-red-600 mt-1">{stats.missingCount || 0}</div>
                </div>
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                  <div className="text-xs font-bold text-amber-700">Đã chấm</div>
                  <div className="text-2xl font-black text-amber-700 mt-1">{stats.gradedCount || 0}</div>
                </div>
              </div>
            </aside>
          </div>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-[0_12px_28px_rgba(15,23,42,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-black text-gray-900">Bài nộp của sinh viên</h3>
              <div className="text-xs font-bold text-gray-500">{submissionRows.length} sinh viên</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-center">STT</th>
                    <th className="px-4 py-3">Sinh viên</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Thời gian nộp</th>
                    <th className="px-4 py-3">File bài làm</th>
                    <th className="px-4 py-3">Điểm</th>
                    <th className="px-4 py-3">Nhận xét</th>
                    <th className="px-4 py-3 text-center">Cập nhật</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {submissionRows.map(({ index, student, submission }: any) => (
                    <tr key={`${student.name}-${student.username || index}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-center text-gray-500 font-semibold">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-gray-900">{student.name}</div>
                        <div className="text-xs text-gray-500">{student.username || "Chưa có MSSV"}</div>
                      </td>
                      <td className="px-4 py-3">
                        {submission ? (
                          <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-extrabold">Đã nộp</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-500 border border-gray-200 text-xs font-extrabold">Chưa nộp</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{submission ? formatDateTime(submission.submittedAt) : "-"}</td>
                      <td className="px-4 py-3">
                        {submission?.file?.url ? (
                          <a href={fileHref(submission.file.url)} target="_blank" className="text-emerald-700 font-bold hover:underline">
                            {submission.file.originalName}
                          </a>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3">
                        {submission ? (
                          <input
                            type="number"
                            min="0"
                            max={selectedAssignment.maxScore}
                            value={gradeDrafts[submission._id]?.grade || ""}
                            onChange={(event) => setGradeDrafts((prev) => ({
                              ...prev,
                              [submission._id]: { ...(prev[submission._id] || { feedback: "" }), grade: event.target.value },
                            }))}
                            className="w-20 rounded-md border border-gray-200 px-2 py-1.5 text-sm font-bold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                          />
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3 min-w-[240px]">
                        {submission ? (
                          <input
                            type="text"
                            value={gradeDrafts[submission._id]?.feedback || ""}
                            onChange={(event) => setGradeDrafts((prev) => ({
                              ...prev,
                              [submission._id]: { ...(prev[submission._id] || { grade: "" }), feedback: event.target.value },
                            }))}
                            placeholder="Nhận xét cho sinh viên"
                            className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                          />
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {submission ? (
                          <button
                            disabled={actionLoading}
                            onClick={() => updateGrade(submission)}
                            className="px-3 py-1.5 rounded-md bg-violet-600 text-white text-xs font-extrabold hover:bg-violet-700 disabled:opacity-50"
                          >
                            Chấm/cập nhật
                          </button>
                        ) : "-"}
                      </td>
                    </tr>
                  ))}
                  {submissionRows.length === 0 && (
                    <tr><td colSpan={8} className="py-12 text-center text-gray-400 font-semibold">Lớp chưa có danh sách sinh viên.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        {isModalOpen && renderModal()}
      </div>
    );
  }

  function renderModal() {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-h-[92vh] flex flex-col">
          <div className="px-6 py-4 bg-gradient-to-r from-violet-600 to-indigo-500 text-white flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black">{editingAssignment ? "Chỉnh sửa bài tập" : "Tạo bài tập mới"}</h3>
              <p className="text-xs text-white/80 font-semibold">Giao bài theo lớp học và theo dõi bài nộp của sinh viên.</p>
            </div>
            <button type="button" onClick={() => setIsModalOpen(false)} className="text-2xl font-bold text-white/80 hover:text-white">×</button>
          </div>
          <div className="p-6 overflow-y-auto space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-gray-500 uppercase mb-1">Tiêu đề bài tập</label>
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" placeholder="Nộp bài tập Lab01" />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-gray-500 uppercase mb-1">Mô tả/yêu cầu bài tập</label>
              <textarea rows={7} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" placeholder={"Chỉ nộp 1 file nén duy nhất...\nTên file: HoVaTen_MSSV.zip\nPhần sản phẩm: tự thiết kế theo ý tưởng riêng"} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-gray-500 uppercase mb-1">Lớp học áp dụng</label>
                <select value={form.classId} onChange={(event) => handleClassChange(event.target.value)} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 bg-white">
                  <option value="">Chọn lớp</option>
                  {myClasses.map((cls) => <option key={cls._id} value={cls._id}>{cls.name} - {cls.subject}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-gray-500 uppercase mb-1">Môn học</label>
                <input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-gray-500 uppercase mb-1">Hạn nộp ngày/giờ</label>
                <input type="datetime-local" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-gray-500 uppercase mb-1">Điểm tối đa</label>
                <input type="number" min="0" step="0.1" value={form.maxScore} onChange={(event) => setForm({ ...form, maxScore: event.target.value })} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-gray-500 uppercase mb-1">Trạng thái</label>
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as "open" | "closed" })} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 bg-white">
                  <option value="open">Đang mở</option>
                  <option value="closed">Đã đóng</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-gray-500 uppercase mb-1">File đính kèm</label>
                <input type="file" onChange={(event) => setAttachment(event.target.files?.[0] || null)} className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 bg-white" />
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md border border-gray-200 bg-white text-gray-600 text-sm font-bold hover:bg-gray-50">Hủy</button>
            <button disabled={actionLoading} type="submit" className="px-5 py-2 rounded-md bg-violet-600 text-white text-sm font-extrabold hover:bg-violet-700 disabled:opacity-50">
              {actionLoading ? "Đang lưu..." : editingAssignment ? "Cập nhật bài tập" : "Tạo bài tập"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f4f5fb] p-0">
      <div className="max-w-7xl mx-auto space-y-4">
        <section className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <div className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 border border-violet-100 font-black">▦</span>
              <div>
                <div className="text-xs font-extrabold text-violet-600 uppercase">Quản lý học tập</div>
                <h2 className="text-2xl font-black mt-1 text-slate-900">Bài tập</h2>
                <p className="text-sm text-slate-500 mt-1 font-semibold">Giao bài, theo dõi bài nộp và chấm điểm theo từng lớp học.</p>
              </div>
            </div>
            <button onClick={openCreateModal} className="px-5 py-3 rounded-xl bg-violet-600 text-white text-sm font-black hover:bg-violet-700 shadow-lg shadow-violet-600/20">
              + Tạo bài tập
            </button>
          </div>
        </section>

        {message.text && (
          <div className={`rounded-lg border px-4 py-3 text-sm font-bold ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
            {message.text}
          </div>
        )}

        <section className="bg-white rounded-2xl border border-slate-200 shadow-[0_12px_28px_rgba(15,23,42,0.06)] p-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={() => setActiveSection("list")} className={`px-4 py-2 rounded-md text-sm font-extrabold ${activeSection === "list" ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Bài tập đã giao</button>
            <button onClick={openCreateModal} className={`px-4 py-2 rounded-md text-sm font-extrabold ${activeSection === "create" ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Tạo bài tập</button>
            <button onClick={() => setActiveSection("submissions")} className={`px-4 py-2 rounded-md text-sm font-extrabold ${activeSection === "submissions" ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Bài nộp của sinh viên</button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <select value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)} className="rounded-md border border-gray-200 px-3 py-2 text-sm font-bold text-gray-700 bg-white outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 min-w-[240px]">
              <option value="">Tất cả lớp phụ trách</option>
              {myClasses.map((cls) => <option key={cls._id} value={cls._id}>{cls.name} - {cls.subject}</option>)}
            </select>
            <button onClick={fetchAssignments} className="px-4 py-2 rounded-md border border-gray-200 bg-white text-gray-600 text-sm font-bold hover:bg-gray-50">Tải lại</button>
          </div>
        </section>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 font-bold">Đang tải danh sách bài tập...</div>
        ) : filteredAssignments.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-14 text-center">
            <div className="text-3xl mb-3">▦</div>
            <h3 className="font-black text-gray-900">Chưa có bài tập nào</h3>
            <p className="text-sm text-gray-500 font-semibold mt-1">Hãy tạo bài tập đầu tiên cho lớp học của bạn.</p>
            <button onClick={openCreateModal} className="mt-5 px-5 py-2.5 rounded-md bg-violet-600 text-white text-sm font-extrabold hover:bg-violet-700">Tạo bài tập</button>
          </div>
        ) : (
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredAssignments.map((assignment) => {
              const overdue = isOverdue(assignment);
              const stats = assignment.stats || {};

              return (
                <article key={assignment._id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-[0_12px_28px_rgba(15,23,42,0.06)] hover:border-violet-200 transition-colors">
                  <div className="p-5 bg-gradient-to-r from-violet-600 to-indigo-500 text-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-black truncate">{assignment.title}</h3>
                        <p className="text-sm text-violet-100 font-semibold mt-1">{assignment.className} · {assignment.subject}</p>
                      </div>
                      <StatusBadge status={assignment.status} overdue={overdue} />
                    </div>
                    <p className="text-sm text-white/70 mt-4 line-clamp-2 whitespace-pre-wrap">{assignment.description || "Không có mô tả."}</p>
                  </div>
                  <div className="p-5 bg-white text-gray-800 grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <div className="text-[11px] font-extrabold text-gray-400 uppercase">Hạn nộp</div>
                      <div className="text-sm font-bold text-gray-800 mt-1">{formatDateTime(assignment.dueAt)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-extrabold text-gray-400 uppercase">Điểm</div>
                      <div className="text-sm font-bold text-gray-800 mt-1">{assignment.maxScore}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-extrabold text-gray-400 uppercase">Đã nộp</div>
                      <div className="text-sm font-bold text-emerald-700 mt-1">{stats.submittedCount || 0}/{stats.totalStudents || 0}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-extrabold text-gray-400 uppercase">Đã chấm</div>
                      <div className="text-sm font-bold text-amber-700 mt-1">{stats.gradedCount || 0}</div>
                    </div>
                  </div>
                  <div className="px-5 py-4 bg-slate-50 border-t border-gray-100 flex flex-wrap justify-end gap-2">
                    <button onClick={() => openDetail(assignment)} className="px-3 py-2 rounded-md bg-violet-600 text-white text-xs font-extrabold hover:bg-violet-700">Xem chi tiết</button>
                    <button onClick={() => openEditModal(assignment)} className="px-3 py-2 rounded-md border border-gray-200 text-gray-600 text-xs font-extrabold hover:bg-gray-50">Sửa</button>
                    <button onClick={() => deleteAssignment(assignment)} className="px-3 py-2 rounded-md border border-red-100 text-red-600 text-xs font-extrabold hover:bg-red-50">Xóa</button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
      {isModalOpen && renderModal()}
    </div>
  );
}
