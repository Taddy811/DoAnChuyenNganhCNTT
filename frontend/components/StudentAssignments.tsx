/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";

type StudentAssignmentsProps = {
  user: any;
  myClasses: any[];
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

const isOverdue = (assignment: any) => new Date(assignment.dueAt).getTime() < Date.now();

const getMySubmission = (assignment: any, user: any) => (
  assignment?.submissions?.find((submission: any) => (
    !submission.isDeleted
    && submission.status === "submitted"
    && (
      submission.studentName === user?.name
      || (user?.username && submission.studentUsername === user.username)
    )
  ))
);

const getAssignmentStatus = (assignment: any, user: any) => {
  const submission = getMySubmission(assignment, user);
  if (submission?.grade !== undefined && submission?.grade !== null) return "graded";
  if (submission) return "submitted";
  if (assignment.status === "closed" || isOverdue(assignment)) return "overdue";
  return "pending";
};

const statusMeta: Record<string, { label: string; className: string }> = {
  pending: { label: "Chưa nộp", className: "bg-amber-50 text-amber-700 border-amber-100" },
  submitted: { label: "Đã nộp", className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  overdue: { label: "Quá hạn", className: "bg-red-50 text-red-600 border-red-100" },
  graded: { label: "Đã chấm", className: "bg-blue-50 text-blue-700 border-blue-100" },
};

const fileHref = (url?: string) => url || "#";

function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta[status] || statusMeta.pending;
  return <span className={`px-2.5 py-1 rounded-md text-xs font-extrabold border ${meta.className}`}>{meta.label}</span>;
}

export default function StudentAssignments({ user, myClasses }: StudentAssignmentsProps) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "submitted" | "overdue">("all");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [privateComment, setPrivateComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | ""; text: string }>({ type: "", text: "" });

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });
      const params = new URLSearchParams();
      params.set("studentName", user?.name || "");
      params.set("studentUsername", user?.username || "");
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
  }, [user?.name, user?.username]);

  useEffect(() => {
    if (!selectedAssignment) return;
    const fresh = assignments.find((assignment) => assignment._id === selectedAssignment._id);
    if (fresh) setSelectedAssignment(fresh);
  }, [assignments, selectedAssignment?._id]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const status = getAssignmentStatus(assignment, user);
      const matchClass = selectedClassId === "" || assignment.classId === selectedClassId;
      const matchStatus = statusFilter === "all"
        || (statusFilter === "submitted" ? status === "submitted" || status === "graded" : status === statusFilter);

      return matchClass && matchStatus;
    }).sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }, [assignments, selectedClassId, statusFilter, user]);

  const counts = useMemo(() => {
    return assignments.reduce((acc, assignment) => {
      const status = getAssignmentStatus(assignment, user);
      acc.all += 1;
      if (status === "graded") acc.submitted += 1;
      else acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, { all: 0, pending: 0, submitted: 0, overdue: 0 } as Record<string, number>);
  }, [assignments, user]);

  const openDetail = (assignment: any) => {
    setSelectedAssignment(assignment);
    setSelectedFile(null);
    setPrivateComment(getMySubmission(assignment, user)?.privateComment || "");
    setMessage({ type: "", text: "" });
  };

  const submitAssignment = async () => {
    if (!selectedAssignment) return;
    if (!selectedFile) {
      setMessage({ type: "error", text: "Vui lòng chọn file bài làm trước khi nộp." });
      return;
    }

    try {
      setActionLoading(true);
      setMessage({ type: "", text: "" });
      const payload = new FormData();
      payload.append("studentName", user?.name || "");
      payload.append("studentUsername", user?.username || "");
      payload.append("privateComment", privateComment);
      payload.append("submissionFile", selectedFile);

      const res = await fetch(`/api/assignments/${selectedAssignment._id}/submit`, {
        method: "POST",
        body: payload,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Không thể nộp bài.");

      setMessage({ type: "success", text: data.message || "Nộp bài thành công." });
      setSelectedFile(null);
      await fetchAssignments();
      if (data.assignment) setSelectedAssignment(data.assignment);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Không thể nộp bài." });
    } finally {
      setActionLoading(false);
    }
  };

  const unsubmitAssignment = async () => {
    if (!selectedAssignment) return;
    if (!confirm("Hủy nộp bài tập này?")) return;

    try {
      setActionLoading(true);
      setMessage({ type: "", text: "" });
      const res = await fetch(`/api/assignments/${selectedAssignment._id}/unsubmit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName: user?.name || "", studentUsername: user?.username || "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Không thể hủy nộp bài.");

      setMessage({ type: "success", text: data.message || "Đã hủy nộp bài." });
      await fetchAssignments();
      if (data.assignment) setSelectedAssignment(data.assignment);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Không thể hủy nộp bài." });
    } finally {
      setActionLoading(false);
    }
  };

  if (selectedAssignment) {
    const submission = getMySubmission(selectedAssignment, user);
    const status = getAssignmentStatus(selectedAssignment, user);
    const locked = status === "overdue" || selectedAssignment.status === "closed";
    const canUnsubmit = Boolean(submission) && !locked;

    return (
      <div className="h-full overflow-y-auto bg-[#f4f5fb] p-0">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
            <button onClick={() => setSelectedAssignment(null)} className="text-sm font-bold text-violet-700 hover:text-violet-800">
              ← Quay lại danh sách bài tập
            </button>
          </div>

          {message.text && (
            <div className={`rounded-lg border px-4 py-3 text-sm font-bold ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5 items-start">
            <main className="bg-white rounded-2xl border border-slate-200 shadow-[0_12px_28px_rgba(15,23,42,0.06)] overflow-hidden">
              <div className="h-28 bg-gradient-to-r from-violet-600 to-indigo-500 p-6 text-white flex items-end">
                <div>
                  <h2 className="text-2xl font-black leading-tight">{selectedAssignment.title}</h2>
                  <p className="text-sm text-white/80 font-semibold mt-1">{selectedAssignment.className} · {selectedAssignment.subject}</p>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-gray-600">
                  <span>Giảng viên: <b className="text-gray-900">{selectedAssignment.instructorName}</b></span>
                  <span>Ngày giao: <b className="text-gray-900">{formatDateTime(selectedAssignment.createdAt)}</b></span>
                  <span>Điểm tối đa: <b className="text-gray-900">{selectedAssignment.maxScore}</b></span>
                  <span>Hạn nộp: <b className={locked ? "text-red-600" : "text-gray-900"}>{formatDateTime(selectedAssignment.dueAt)}</b></span>
                  <StatusBadge status={status} />
                </div>

                <div className="h-px bg-gray-100" />

                <section>
                  <h3 className="font-black text-gray-900 mb-3">Yêu cầu bài tập</h3>
                  <div className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                    {selectedAssignment.description || "Giảng viên chưa nhập mô tả bài tập."}
                  </div>
                </section>

                <section>
                  <h3 className="font-black text-gray-900 mb-3">File đính kèm từ giảng viên</h3>
                  {selectedAssignment.attachment?.url ? (
                    <a href={fileHref(selectedAssignment.attachment.url)} target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100">
                      Mở file: {selectedAssignment.attachment.originalName}
                    </a>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm font-semibold text-gray-400">
                      Bài tập này không có file đính kèm.
                    </div>
                  )}
                </section>

                {submission?.privateComment && (
                  <section>
                    <h3 className="font-black text-gray-900 mb-3">Nhận xét riêng tư đã gửi</h3>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">{submission.privateComment}</div>
                  </section>
                )}
              </div>
            </main>

            <aside className="space-y-4">
              <section className="bg-white rounded-2xl border border-slate-200 shadow-[0_12px_28px_rgba(15,23,42,0.06)] overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-black text-gray-900">Bài tập của bạn</h3>
                  <StatusBadge status={status} />
                </div>
                <div className="p-5 space-y-4">
                  {submission ? (
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                      <div className="text-sm font-black text-emerald-700 mb-2">Đã nộp</div>
                      <a href={fileHref(submission.file?.url)} target="_blank" className="text-sm font-bold text-emerald-800 hover:underline break-all">
                        {submission.file?.originalName || "File bài làm"}
                      </a>
                      <div className="text-xs font-semibold text-emerald-700 mt-2">Nộp lúc: {formatDateTime(submission.submittedAt)}</div>
                    </div>
                  ) : locked ? (
                    <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
                      Đã quá hạn nộp hoặc bài tập đã đóng.
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
                      <div className="text-sm font-black text-gray-700">Chưa nộp bài</div>
                      <p className="text-xs font-semibold text-gray-500 mt-1">Chọn file bài làm để nộp cho giảng viên.</p>
                    </div>
                  )}

                  {!locked && (
                    <div className="space-y-3">
                      <label className="block">
                        <span className="block text-xs font-extrabold text-gray-500 uppercase mb-1">Chọn file</span>
                        <input type="file" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold bg-white" />
                      </label>
                      {selectedFile && (
                        <div className="rounded-md bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 break-all">
                          File đã chọn: {selectedFile.name}
                        </div>
                      )}
                      <button disabled={actionLoading || !selectedFile} onClick={submitAssignment} className="w-full rounded-lg bg-violet-600 px-4 py-3 text-sm font-black text-white hover:bg-violet-700 disabled:opacity-50">
                        {submission ? "Nộp lại bài" : "Nộp bài"}
                      </button>
                    </div>
                  )}

                  {canUnsubmit && (
                    <button disabled={actionLoading} onClick={unsubmitAssignment} className="w-full rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-black text-red-600 hover:bg-red-50 disabled:opacity-50">
                      Hủy nộp bài
                    </button>
                  )}

                  {submission?.grade !== undefined && submission?.grade !== null && (
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                      <div className="text-xs font-extrabold text-blue-600 uppercase">Điểm</div>
                      <div className="text-2xl font-black text-blue-700 mt-1">{submission.grade}/{selectedAssignment.maxScore}</div>
                      {submission.feedback && <div className="text-sm text-blue-800 font-semibold mt-3">Nhận xét: {submission.feedback}</div>}
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-slate-200 shadow-[0_12px_28px_rgba(15,23,42,0.06)] p-5">
                <h3 className="font-black text-gray-900 mb-3">Nhận xét riêng tư</h3>
                <textarea
                  rows={4}
                  value={privateComment}
                  onChange={(event) => setPrivateComment(event.target.value)}
                  placeholder="Nhập ghi chú gửi giảng viên khi nộp bài..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  disabled={locked}
                />
                <p className="text-xs font-semibold text-gray-400 mt-2">Nhận xét sẽ được gửi kèm lần nộp bài hiện tại.</p>
              </section>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f4f5fb] p-0">
      <div className="max-w-7xl mx-auto space-y-4">
        <section className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <div className="p-5 flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 border border-violet-100 font-black">▦</span>
            <div>
              <div className="text-xs font-extrabold text-violet-600 uppercase">Không gian học tập</div>
              <h2 className="text-2xl font-black mt-1 text-slate-900">Bài tập online</h2>
              <p className="text-sm text-slate-500 mt-1 font-semibold">Xem bài tập được giao, nộp bài và theo dõi điểm trong hệ thống LMS.</p>
            </div>
          </div>
        </section>

        {message.text && (
          <div className={`rounded-lg border px-4 py-3 text-sm font-bold ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
            {message.text}
          </div>
        )}

        <section className="bg-white rounded-2xl border border-slate-200 shadow-[0_12px_28px_rgba(15,23,42,0.06)] p-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              ["all", `Tất cả (${counts.all || 0})`],
              ["pending", `Chưa nộp (${counts.pending || 0})`],
              ["submitted", `Đã nộp (${counts.submitted || 0})`],
              ["overdue", `Quá hạn (${counts.overdue || 0})`],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key as "all" | "pending" | "submitted" | "overdue")}
                className={`px-4 py-2 rounded-md text-sm font-extrabold ${statusFilter === key ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <select value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)} className="rounded-md border border-gray-200 px-3 py-2 text-sm font-bold text-gray-700 bg-white outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 min-w-[240px]">
              <option value="">Tất cả lớp học</option>
              {myClasses.map((cls) => <option key={cls._id} value={cls._id}>{cls.name} - {cls.subject}</option>)}
            </select>
            <button onClick={fetchAssignments} className="px-4 py-2 rounded-md border border-gray-200 bg-white text-gray-600 text-sm font-bold hover:bg-gray-50">Tải lại</button>
          </div>
        </section>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 font-bold">Đang tải bài tập online...</div>
        ) : filteredAssignments.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-14 text-center">
            <div className="text-3xl mb-3">▦</div>
            <h3 className="font-black text-gray-900">Chưa có bài tập phù hợp</h3>
            <p className="text-sm text-gray-500 font-semibold mt-1">Bài tập mới từ giảng viên sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredAssignments.map((assignment) => {
              const status = getAssignmentStatus(assignment, user);
              const submission = getMySubmission(assignment, user);

              return (
                <article key={assignment._id} className="bg-white rounded-2xl border border-slate-200 shadow-[0_12px_28px_rgba(15,23,42,0.06)] overflow-hidden hover:border-violet-300 transition-colors">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-black text-gray-900 truncate">{assignment.title}</h3>
                        <p className="text-sm text-gray-500 font-semibold mt-1">{assignment.className} · {assignment.subject}</p>
                      </div>
                      <StatusBadge status={status} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                      <div>
                        <div className="text-[11px] font-extrabold text-gray-400 uppercase">Giảng viên</div>
                        <div className="text-sm font-bold text-gray-800 mt-1 truncate">{assignment.instructorName}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-extrabold text-gray-400 uppercase">Hạn nộp</div>
                        <div className={`text-sm font-bold mt-1 ${status === "overdue" ? "text-red-600" : "text-gray-800"}`}>{formatDateTime(assignment.dueAt)}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-extrabold text-gray-400 uppercase">Điểm</div>
                        <div className="text-sm font-bold text-gray-800 mt-1">{assignment.maxScore}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-extrabold text-gray-400 uppercase">Bài của bạn</div>
                        <div className="text-sm font-bold text-emerald-700 mt-1">{submission ? "Có file" : "Chưa có"}</div>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
                    <div className="text-xs font-semibold text-gray-500 truncate">
                      {submission?.grade !== undefined && submission?.grade !== null ? `Điểm: ${submission.grade}/${assignment.maxScore}` : "Mở chi tiết để nộp bài"}
                    </div>
                    <button onClick={() => openDetail(assignment)} className="px-4 py-2 rounded-md bg-violet-600 text-white text-xs font-extrabold hover:bg-violet-700">
                      Xem chi tiết
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
