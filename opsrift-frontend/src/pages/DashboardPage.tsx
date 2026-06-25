import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  BarChart3,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  Activity,
  Users,
  ArrowUpRight,
  Sparkles,
  X,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import axiosInstance from "../api/axiosInstance";
import { cn } from "../utils/cn";

/* ──────────────────────────────────────────────────────
   Stat card — large hero metric with gradient accent bar
────────────────────────────────────────────────────── */
const StatCard = ({
  title,
  value,
  icon: Icon,
  accent,
  sub,
  delay = 0,
}: {
  title: string;
  value: number | string;
  icon: any;
  accent: string; // tailwind bg class for icon bg
  sub?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, delay }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="bg-white rounded-[1.75rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 flex flex-col justify-between gap-6 min-h-[140px]"
  >
    <div className="flex items-start justify-between">
      <div
        className={cn(
          "w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm",
          accent
        )}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      {sub && (
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
          {sub}
        </span>
      )}
    </div>
    <div>
      <h3 className="text-4xl font-black font-heading text-slate-900 tracking-tight leading-none">
        {value}
      </h3>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
        {title}
      </p>
    </div>
  </motion.div>
);

/* ──────────────────────────────────────────────────────
   Status badge helper
────────────────────────────────────────────────────── */
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    done: "bg-emerald-50 text-emerald-700 border-emerald-100",
    inprogress: "bg-blue-50 text-blue-700 border-blue-100",
    overdue: "bg-red-50 text-red-700 border-red-100",
    pending: "bg-amber-50 text-amber-700 border-amber-100",
  };
  const labels: Record<string, string> = {
    done: "Done",
    inprogress: "In Progress",
    overdue: "Overdue",
    pending: "Pending",
  };
  return (
    <span
      className={cn(
        "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border",
        map[status] ?? "bg-slate-50 text-slate-500 border-slate-100"
      )}
    >
      {labels[status] ?? status}
    </span>
  );
};

/* ──────────────────────────────────────────────────────
   Compact progress bar used in the overdue panel
────────────────────────────────────────────────────── */
const ProgressBar = ({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-bold text-slate-500">{label}</span>
        <span className="text-xs font-black text-slate-900">
          {value}{" "}
          <span className="text-slate-300 font-bold">/ {total}</span>
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────
   Main Dashboard Page
────────────────────────────────────────────────────── */
const DashboardPage = () => {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isStaff = user?.role === "staff";

  // Prioritization State
  const [priorities, setPriorities] = useState<Record<string, { priority: string; reason: string }>>({});
  const [isPrioritizing, setIsPrioritizing] = useState(false);

  // Weekly Summary State
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  const handlePrioritize = async () => {
    setIsPrioritizing(true);
    try {
      const res = await axiosInstance.post("/tasks/ai-prioritize");
      const mapping: Record<string, { priority: string; reason: string }> = {};
      res.data.forEach((p: any) => {
        mapping[p.taskId] = { priority: p.priority, reason: p.reason };
      });
      setPriorities(mapping);
    } catch (err) {
      console.error("Failed to prioritize tasks:", err);
    } finally {
      setIsPrioritizing(false);
    }
  };

  const handleOpenWeeklySummary = async () => {
    setIsSummaryModalOpen(true);
    setSummaryLoading(true);
    try {
      const res = await axiosInstance.get("/tasks/ai-weekly-summary");
      setWeeklySummary(res.data.summary || "");
    } catch (err) {
      console.error("Failed to fetch weekly summary:", err);
      setWeeklySummary("Failed to generate weekly operations summary report.");
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/tasks");
        setTasks(res.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const pending = tasks.filter((t) => t.status === "pending").length;
  const inProgress = tasks.filter((t) => t.status === "inprogress").length;
  const overdue = tasks.filter((t) => t.status === "overdue").length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  /* Recent tasks — most recent first, capped at 6. If prioritized, order by high, medium, low */
  let recentTasks = [...tasks]
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime()
    );

  if (isStaff && Object.keys(priorities).length > 0) {
    const priorityOrder: Record<string, number> = { high: 1, medium: 2, low: 3 };
    recentTasks.sort((a, b) => {
      const aPriority = priorities[a._id]?.priority || "none";
      const bPriority = priorities[b._id]?.priority || "none";
      const aVal = priorityOrder[aPriority] || 99;
      const bVal = priorityOrder[bPriority] || 99;
      return aVal - bVal;
    });
  }

  recentTasks = recentTasks.slice(0, 6);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ── HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 mb-1"
          >
            {isStaff ? "Staff Portal" : "Operations Overview"}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-black font-heading text-slate-900 tracking-tight"
          >
            Good{" "}
            {new Date().getHours() < 12
              ? "morning"
              : new Date().getHours() < 17
              ? "afternoon"
              : "evening"}
            ,{" "}
            <span className="text-indigo-600">{user?.name?.split(" ")[0] ?? "User"}</span>
            {" "}👋
          </motion.h1>
          <p className="text-slate-400 font-medium text-sm mt-1">
            {isStaff
              ? "Here's what's on your plate today."
              : `You have ${overdue > 0 ? `${overdue} overdue task${overdue > 1 ? "s" : ""} — ` : ""}${pending + inProgress} active operations.`}
          </p>
        </div>

        {/* Completion pill — managers/admins only */}
        {!isStaff && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-5 py-3.5 shadow-sm self-start lg:self-auto"
          >
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="16" stroke="#f1f5f9" strokeWidth="4" fill="none" />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="#4f46e5"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${completionRate} 100`}
                  strokeDashoffset="0"
                  pathLength="100"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-indigo-600">
                {completionRate}%
              </span>
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">Completion Rate</p>
              <p className="text-[10px] text-slate-400 font-medium">
                {done} of {total} tasks done
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── STATS GRID ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {isStaff ? (
          <>
            <StatCard title="Assigned to Me" value={total} icon={Users} accent="bg-indigo-600" delay={0} />
            <StatCard title="In Progress" value={inProgress} icon={Activity} accent="bg-blue-500" sub="Active" delay={0.05} />
            <StatCard title="Pending" value={pending} icon={Clock} accent="bg-amber-500" delay={0.1} />
            <StatCard title="Completed" value={done} icon={CheckCircle2} accent="bg-emerald-500" delay={0.15} />
          </>
        ) : (
          <>
            <StatCard title="Total Workload" value={total} icon={BarChart3} accent="bg-indigo-600" delay={0} />
            <StatCard title="Overdue Incidents" value={overdue} icon={AlertTriangle} accent="bg-red-500" sub={overdue > 0 ? "Urgent" : undefined} delay={0.05} />
            <StatCard title="Active Operations" value={pending + inProgress} icon={TrendingUp} accent="bg-amber-500" delay={0.1} />
            <StatCard title="Resolved" value={done} icon={CheckCircle2} accent="bg-emerald-500" delay={0.15} />
          </>
        )}
      </div>

      {/* ── MAIN CONTENT — 2-col on manager/admin, 1-col on staff ── */}
      <div className={cn("grid gap-6", !isStaff ? "lg:grid-cols-3" : "")}>
        {/* Task list — takes 2 cols */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden",
            !isStaff ? "lg:col-span-2" : ""
          )}
        >
          <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black font-heading text-slate-900 tracking-tight">
                {isStaff ? "Your Task Queue" : "System Task Board"}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Showing {Math.min(recentTasks.length, 6)} most recent entries
              </p>
            </div>
            {isStaff && (
              <div className="flex gap-2">
                {Object.keys(priorities).length > 0 && (
                  <button
                    onClick={() => setPriorities({})}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all border-none cursor-pointer"
                  >
                    Reset Order
                  </button>
                )}
                <button
                  onClick={handlePrioritize}
                  disabled={isPrioritizing || recentTasks.length === 0}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-all disabled:opacity-50 border-none cursor-pointer"
                >
                  <Sparkles size={11} /> {isPrioritizing ? "Sorting..." : "✨ Prioritise My Tasks"}
                </button>
              </div>
            )}
            <Link
              to="/tasks"
              className="flex items-center gap-1.5 text-indigo-600 text-xs font-black uppercase tracking-widest hover:gap-2.5 transition-all"
            >
              View All <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="divide-y divide-slate-50">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-7 py-5">
                  <div className="w-10 h-10 bg-slate-100 rounded-2xl animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-slate-100 rounded-full animate-pulse w-3/4" />
                    <div className="h-2.5 bg-slate-50 rounded-full animate-pulse w-1/2" />
                  </div>
                </div>
              ))
            ) : recentTasks.length === 0 ? (
              <div className="px-7 py-16 text-center">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={24} className="text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-400">No tasks yet</p>
              </div>
            ) : (
              recentTasks.map((task: any, idx: number) => (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + idx * 0.05 }}
                >
                  <Link
                    to={`/tasks/${task._id}`}
                    className="flex items-center gap-4 px-7 py-4 hover:bg-slate-50/80 transition-all group/row"
                  >
                    {/* Status icon */}
                    <div
                      className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all",
                        task.status === "done"
                          ? "bg-emerald-50 text-emerald-500"
                          : task.status === "overdue"
                          ? "bg-red-50 text-red-500"
                          : task.status === "inprogress"
                          ? "bg-blue-50 text-blue-500"
                          : "bg-amber-50 text-amber-500"
                      )}
                    >
                      {task.status === "done" ? (
                        <CheckCircle2 size={18} />
                      ) : task.status === "overdue" ? (
                        <AlertTriangle size={18} />
                      ) : (
                        <Clock size={18} />
                      )}
                    </div>

                    {/* Task info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-slate-900 truncate group-hover/row:text-indigo-600 transition-colors">
                          {task.title}
                        </p>
                        {priorities[task._id] && (
                          <span
                            title={priorities[task._id].reason}
                            className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shrink-0",
                              priorities[task._id].priority === "high"
                                ? "bg-red-50 text-red-600 border-red-100"
                                : priorities[task._id].priority === "medium"
                                ? "bg-amber-50 text-amber-600 border-amber-100"
                                : "bg-blue-50 text-blue-600 border-blue-100"
                            )}
                          >
                            {priorities[task._id].priority}
                          </span>
                        )}
                      </div>
                      {priorities[task._id] && (
                        <p className="text-[10px] text-amber-600 font-bold truncate mt-0.5">
                          💡 {priorities[task._id].reason}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-slate-400 font-bold">
                          Due{" "}
                          {new Date(task.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        {!isStaff && task.assignedTo && (
                          <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                            {task.assignedTo.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={task.status} />
                      <ChevronRight
                        size={15}
                        className="text-slate-300 group-hover/row:text-indigo-500 group-hover/row:translate-x-0.5 transition-all"
                      />
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* ── RIGHT SIDEBAR — Manager/Admin only ── */}
        {!isStaff && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-5"
          >
            {/* Progress breakdown */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-7">
              <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-400 mb-6">
                Status Breakdown
              </h3>
              <div className="space-y-4">
                <ProgressBar label="Completed" value={done} total={total} color="bg-emerald-500" />
                <ProgressBar label="In Progress" value={inProgress} total={total} color="bg-blue-500" />
                <ProgressBar label="Pending" value={pending} total={total} color="bg-amber-400" />
                <ProgressBar label="Overdue" value={overdue} total={total} color="bg-red-500" />
              </div>
            </div>

            {/* Overdue alert box */}
            {overdue > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-red-50 border border-red-100 rounded-[2rem] p-6"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center shrink-0">
                    <AlertTriangle size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-red-800">
                      {overdue} Overdue Task{overdue > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-red-500 font-medium mt-1 leading-relaxed">
                      Immediate attention required. Review the task board and
                      reassign as needed.
                    </p>
                  </div>
                </div>
                <Link
                  to="/tasks"
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors"
                >
                  Review Now <ArrowUpRight size={12} />
                </Link>
              </motion.div>
            )}

            {/* Quick links */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-7">
              <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-400 mb-5">
                Quick Access
              </h3>
              <button
                onClick={handleOpenWeeklySummary}
                className="mb-4 flex items-center justify-center gap-2 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-95 border-none cursor-pointer"
              >
                📊 Generate Weekly Summary
              </button>
              <div className="space-y-2">
                {[
                  { label: "All Tasks", to: "/tasks", icon: BarChart3 },
                  { label: "Staff Operations", to: "/tasks", icon: Users },
                ].map(({ label, to, icon: Ic }) => (
                  <Link
                    key={label}
                    to={to}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-2xl group transition-all border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <Ic size={14} className="text-indigo-600" />
                      </div>
                      <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                        {label}
                      </span>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Weekly Summary Modal */}
      <AnimatePresence>
        {isSummaryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSummaryModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] border border-slate-100 p-8 shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl md:text-2xl font-black font-heading text-slate-900 tracking-tight">
                    Weekly Operational Digest
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Generated by Gemini AI Assistant</p>
                </div>
                <button
                  onClick={() => setIsSummaryModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {summaryLoading ? (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner mx-auto">
                      <svg className="animate-spin w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    </div>
                  </div>
                  <h4 className="text-base font-black text-indigo-900 font-heading">Analyzing Operations...</h4>
                  <p className="text-xs text-indigo-400 mt-1 font-medium animate-pulse">Aggregating documentation reports for last 7 days…</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 max-h-[350px] overflow-y-auto">
                    <div className="prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-line">
                      {weeklySummary}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsSummaryModalOpen(false)}
                      className="flex-1 h-14 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black font-heading text-xs uppercase tracking-widest transition-all"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(weeklySummary);
                        alert("Copied to clipboard!");
                      }}
                      className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black font-heading text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95 border-none cursor-pointer"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardPage;
