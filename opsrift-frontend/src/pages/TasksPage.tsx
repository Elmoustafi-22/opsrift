import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  Calendar,
  ChevronRight,
  Search,
  LayoutGrid,
  List,
  Filter,
  Plus,
  X,
  Sparkles,
  ChevronDown,
  Download,
  FileText,
  Printer,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { cn } from "../utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";

const TasksPage = () => {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignedTo: "",
    dueDate: "",
  });

  // AI Breakdown States
  const [isAiMode, setIsAiMode] = useState(false);
  const [goal, setGoal] = useState("");
  const [aiTasks, setAiTasks] = useState<any[]>([]);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const isManagement = user?.role === "admin" || user?.role === "manager";

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/tasks");
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchStaff = async () => {
    try {
      setModalLoading(true);
      setModalError("");
      const response = await axiosInstance.get("/users");
      setStaffList(response.data);
    } catch (err: any) {
      console.error(err);
      setModalError("Failed to fetch staff members list");
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setIsAiMode(false);
    setGoal("");
    setAiTasks([]);
    setModalError("");
    fetchStaff();
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.assignedTo || !newTask.dueDate) {
      setModalError("Please fill out all required fields");
      return;
    }

    try {
      setModalLoading(true);
      await axiosInstance.post("/tasks", newTask);
      setIsModalOpen(false);
      setNewTask({
        title: "",
        description: "",
        assignedTo: "",
        dueDate: "",
      });
      fetchTasks();
    } catch (err: any) {
      setModalError(err.response?.data?.message || "Failed to create task");
    } finally {
      setModalLoading(false);
    }
  };

  const handleGenerateBreakdown = async () => {
    if (!goal.trim()) {
      setModalError("Please enter a goal description");
      return;
    }
    setAiGenerating(true);
    setModalError("");
    try {
      const res = await axiosInstance.post("/tasks/ai-breakdown", { goal });
      const formatted = res.data.map((task: any) => {
        const days = task.estimatedDays || 2;
        const dueDateVal = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 16);
        return {
          title: task.title,
          description: task.description,
          suggestedRole: task.suggestedRole || "staff",
          assignedTo: "",
          dueDate: dueDateVal,
        };
      });
      setAiTasks(formatted);
    } catch (err: any) {
      setModalError(err.response?.data?.message || "Failed to generate AI breakdown");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCreateBulkTasks = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = aiTasks.some((t) => !t.title || !t.assignedTo || !t.dueDate);
    if (invalid) {
      setModalError("Please select an assignee and due date for all subtasks");
      return;
    }

    try {
      setModalLoading(true);
      setModalError("");
      await axiosInstance.post("/tasks/bulk", { tasks: aiTasks });
      setIsModalOpen(false);
      setGoal("");
      setAiTasks([]);
      fetchTasks();
    } catch (err: any) {
      setModalError(err.response?.data?.message || "Failed to create bulk tasks");
    } finally {
      setModalLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task: any) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (activeTab === "active") {
      return (task.status === "pending" || task.status === "inprogress") && matchesSearch;
    } else {
      return (task.status === "done" || task.status === "overdue") && matchesSearch;
    }
  });

  const handleExportClientCSV = () => {
    const headers = ["Task ID", "Title", "Description", "Status", "Assigned To", "Due Date", "Created At"];
    const rows = filteredTasks.map((t: any) => [
      `"${t._id}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${(t.description || "").replace(/"/g, '""')}"`,
      `"${t.status}"`,
      `"${t.assignedTo?.name || "Unassigned"}"`,
      `"${t.dueDate ? new Date(t.dueDate).toISOString() : ""}"`,
      `"${t.createdAt ? new Date(t.createdAt).toISOString() : ""}"`
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `tasks_report_client_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportServerCSV = async (endpoint: string, filename: string) => {
    try {
      const response = await axiosInstance.get(endpoint, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export server-side CSV:", error);
      alert("Failed to export report. Please try again.");
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-black font-heading text-slate-900 tracking-tight">
            Ops Tasks
          </h1>
          <p className="text-slate-500 mt-1 md:mt-2 font-medium text-sm md:text-lg">
            {activeTab === "active"
              ? "Track and manage your active operations."
              : "Review completed operations and overdue metrics."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 md:gap-2 bg-white p-1.5 md:p-2 rounded-2xl border border-slate-100 shadow-sm self-start w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("active")}
              className={cn(
                "flex-1 sm:flex-none px-4 md:px-8 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-black font-heading transition-all duration-300 flex items-center justify-center gap-2",
                activeTab === "active"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-[1.02] md:scale-105"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
            >
              <Clock size={16} /> Active
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={cn(
                "flex-1 sm:flex-none px-4 md:px-8 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-black font-heading transition-all duration-300 flex items-center justify-center gap-2",
                activeTab === "history"
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-[1.02] md:scale-105"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
            >
              History & Overdue
            </button>
          </div>

          {/* Export Reports Dropdown */}
          <div className="relative no-print">
            <button
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="px-5 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl text-sm font-black font-heading transition-all duration-300 flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
            >
              <Download size={18} className="text-slate-400" /> Export Reports <ChevronDown size={16} className={cn("text-slate-400 transition-transform duration-300", isExportDropdownOpen && "rotate-180")} />
            </button>
            
            <AnimatePresence>
              {isExportDropdownOpen && (
                <>
                  {/* Backdrop to close dropdown on click outside */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsExportDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2.5 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl p-2 z-20 flex flex-col gap-1.5"
                  >
                    <div className="px-3.5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                      Export Operations Data
                    </div>
                    
                    <button
                      onClick={() => {
                        handleExportClientCSV();
                        setIsExportDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <FileText size={14} className="text-slate-400" /> Tasks List (Client CSV)
                    </button>

                    <button
                      onClick={() => {
                        handleExportServerCSV("/tasks/export/csv", `tasks_report_server_${Date.now()}.csv`);
                        setIsExportDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Download size={14} className="text-slate-400" /> Full Tasks (Server CSV)
                    </button>

                    {isManagement && (
                      <button
                        onClick={() => {
                          handleExportServerCSV("/docs/export/csv", `documentation_report_server_${Date.now()}.csv`);
                          setIsExportDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Download size={14} className="text-slate-400" /> Doc Submissions (Server CSV)
                      </button>
                    )}

                    <button
                      onClick={() => {
                        handlePrintPDF();
                        setIsExportDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2 border-t border-slate-50 pt-2.5 cursor-pointer"
                    >
                      <Printer size={14} className="text-indigo-500" /> Save Report to PDF
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {isManagement && (
            <button
              onClick={handleOpenModal}
              className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-black font-heading transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 active:scale-95"
            >
              <Plus size={18} /> Create Task
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 items-center justify-between">
        <div className="relative w-full sm:max-w-md group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-5 py-3.5 md:py-4 bg-white border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all shadow-sm placeholder:text-slate-300"
          />
        </div>

        <div className="flex items-center bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
          <button
            onClick={() => setView("grid")}
            className={cn(
              "p-2.5 rounded-xl transition-all duration-300",
              view === "grid"
                ? "bg-slate-100 text-indigo-600 shadow-inner"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "p-2.5 rounded-xl transition-all duration-300",
              view === "list"
                ? "bg-slate-100 text-indigo-600 shadow-inner"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-80 bg-white rounded-[2.5rem] border border-slate-100 animate-pulse"
            />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-100 rounded-2xl md:rounded-[3rem] p-8 md:p-24 text-center shadow-sm"
        >
          <div className="w-20 h-20 md:w-28 md:h-28 bg-slate-50 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner">
            <Filter className="text-slate-300" size={32} />
          </div>
          <h2 className="text-xl md:text-3xl font-black text-slate-900 font-heading tracking-tight">
            No tasks detected
          </h2>
          <p className="text-slate-500 mt-4 max-w-sm mx-auto font-medium text-lg">
            {searchQuery
              ? "We couldn't find any tasks matching your current search parameters."
              : activeTab === "active"
              ? "Your task log is clear."
              : "No historical records found in your task archives."}
          </p>
          {searchQuery && (
            <button
              className="mt-10 px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-colors shadow-lg shadow-slate-900/10"
              onClick={() => setSearchQuery("")}
            >
              Reset Search Filter
            </button>
          )}
        </motion.div>
      ) : (
        <div
          className={cn(
            "gap-8",
            view === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col"
          )}
        >
          {filteredTasks.map((task: any) => (
            <Link
              key={task._id}
              to={`/tasks/${task._id}`}
              className={cn(
                "bg-white rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 md:hover:-translate-y-2 transition-all duration-500 group overflow-hidden flex flex-col",
                view === "list" && "md:flex-row md:items-center md:p-2"
              )}
            >
              <div
                className={cn(
                  "p-6 md:p-10 flex-1",
                  view === "list" && "p-4 md:p-4 flex flex-row items-center gap-4 md:gap-8"
                )}
              >
                <div
                  className={cn(
                    "w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-[1.75rem] flex items-center justify-center mb-6 md:mb-8 transition-all duration-500 group-hover:scale-110 shadow-sm relative overflow-hidden",
                    task.status === "done"
                      ? "bg-emerald-50 text-emerald-600"
                      : task.status === "inprogress"
                      ? "bg-blue-50 text-blue-600"
                      : task.status === "overdue"
                      ? "bg-red-50 text-red-600"
                      : "bg-indigo-50 text-indigo-600",
                    view === "list" && "mb-0 shrink-0"
                  )}
                >
                  <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {task.status === "done" ? (
                    <CheckCircle2 size={24} className="md:w-9 md:h-9 relative z-10" />
                  ) : (
                    <Clock size={24} className="md:w-9 md:h-9 relative z-10" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2 md:mb-3 gap-3 md:gap-4">
                    <h3 className="text-lg md:text-2xl font-black font-heading text-slate-900 group-hover:text-indigo-600 transition-colors truncate tracking-tight">
                      {task.title}
                    </h3>
                  </div>

                  <p className="text-sm md:text-base text-slate-500 line-clamp-2 mb-6 md:mb-8 leading-relaxed font-medium">
                    {task.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 md:gap-4 font-heading">
                    <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-slate-400 bg-slate-50 px-3 md:px-4 py-1.5 md:py-2 rounded-xl uppercase tracking-widest border border-slate-100">
                      <Calendar size={12} className="text-slate-300 md:w-[14px] md:h-[14px]" />
                      {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    {task.assignedTo && (
                      <span className="text-[9px] md:text-[10px] text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 uppercase tracking-widest">
                        Staff: {task.assignedTo.name}
                      </span>
                    )}
                    <span
                      className={cn(
                        "px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border shadow-sm",
                        task.status === "done"
                          ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                          : task.status === "inprogress"
                          ? "bg-blue-50 border-blue-100 text-blue-700"
                          : task.status === "overdue"
                          ? "bg-red-50 border-red-100 text-red-700"
                          : "bg-amber-50 border-amber-100 text-amber-700"
                      )}
                    >
                      {task.status || "pending"}
                    </span>
                  </div>
                </div>
              </div>

              {view === "grid" && (
                <div className="px-6 md:px-10 py-4 md:py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between mt-auto group-hover:bg-white transition-colors">
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Ops Protocol
                  </p>
                  <div className="flex items-center gap-1.5 md:gap-2 text-indigo-600 text-[10px] md:text-xs font-black uppercase tracking-widest group-hover:translate-x-1 md:group-hover:translate-x-2 transition-transform">
                    View Details <ChevronRight size={14} className="md:w-4 md:h-4" />
                  </div>
                </div>
              )}

              {view === "list" && (
                <div className="pr-8 py-4 md:py-0">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-600/30 transition-all duration-300">
                    <ChevronRight size={24} />
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Task Creation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className={cn(
                "bg-white w-full rounded-[2.5rem] border border-slate-100 p-8 shadow-2xl relative z-10 overflow-hidden transition-all duration-300",
                isAiMode && aiTasks.length > 0 ? "max-w-3xl" : "max-w-lg"
              )}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl md:text-2xl font-black font-heading text-slate-900 tracking-tight">
                    {isAiMode ? "AI Goal Breakdown" : "Create Operational Task"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAiMode(!isAiMode);
                      setModalError("");
                    }}
                    className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 mt-1 flex items-center gap-1 bg-transparent border-none cursor-pointer"
                  >
                    <Sparkles size={12} /> {isAiMode ? "Switch to Manual Mode" : "Switch to AI Mode"}
                  </button>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {modalError && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  {modalError}
                </div>
              )}

              {isAiMode ? (
                // 🪄 AI Mode Layout
                aiTasks.length === 0 ? (
                  aiGenerating ? (
                    // Shimmer Loader for AI
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <div className="relative mb-6">
                        <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                          <Sparkles size={28} className="animate-pulse" />
                        </div>
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full animate-ping" />
                      </div>
                      <h4 className="text-lg font-black text-slate-950 font-heading">Consulting Gemini AI...</h4>
                      <p className="text-sm text-slate-400 font-medium max-w-xs mt-2 leading-relaxed">
                        Breaking down your goal into actionable, role-based tasks and timelines.
                      </p>
                    </div>
                  ) : (
                    // Goal Input Form
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                          Operational Goal
                        </label>
                        <textarea
                          required
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all min-h-[120px] resize-none placeholder:text-slate-300"
                          placeholder="E.g. Onboard new client or Migrate database to cloud..."
                          value={goal}
                          onChange={(e) => setGoal(e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateBreakdown}
                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black font-heading text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Sparkles size={16} /> Generate Task Breakdown
                      </button>
                    </div>
                  )
                ) : (
                  // Display subtasks checklist
                  <form onSubmit={handleCreateBulkTasks} className="space-y-6">
                    <div className="max-h-[380px] overflow-y-auto pr-1 space-y-5 divide-y divide-slate-100">
                      {aiTasks.map((task, idx) => (
                        <div key={idx} className={cn("space-y-4", idx > 0 && "pt-5")}>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                              Subtask {idx + 1}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                              Suggested Role: {task.suggestedRole}
                            </span>
                          </div>

                          <div className="space-y-3">
                            <input
                              type="text"
                              required
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                              value={task.title}
                              onChange={(e) => {
                                const copy = [...aiTasks];
                                copy[idx].title = e.target.value;
                                setAiTasks(copy);
                              }}
                            />
                            <textarea
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all min-h-[50px] resize-none"
                              value={task.description}
                              onChange={(e) => {
                                const copy = [...aiTasks];
                                copy[idx].description = e.target.value;
                                setAiTasks(copy);
                              }}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Assign Operator</label>
                              <select
                                required
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                                value={task.assignedTo}
                                onChange={(e) => {
                                  const copy = [...aiTasks];
                                  copy[idx].assignedTo = e.target.value;
                                  setAiTasks(copy);
                                }}
                              >
                                <option value="">Assign staff member</option>
                                {staffList.map((staff: any) => (
                                  <option key={staff._id} value={staff._id}>
                                    {staff.name} ({staff.role})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Due Date</label>
                              <input
                                type="datetime-local"
                                required
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 focus:outline-none"
                                value={task.dueDate}
                                onChange={(e) => {
                                  const copy = [...aiTasks];
                                  copy[idx].dueDate = e.target.value;
                                  setAiTasks(copy);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-slate-50">
                      <button
                        type="button"
                        onClick={() => setAiTasks([])}
                        className="flex-1 h-14 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-black font-heading text-xs uppercase tracking-widest transition-all"
                      >
                        Reset Goal
                      </button>
                      <button
                        type="submit"
                        disabled={modalLoading}
                        className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black font-heading text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                      >
                        {modalLoading ? "Creating Tasks..." : "Confirm & Launch Tasks"}
                      </button>
                    </div>
                  </form>
                )
              ) : (
                // 📝 Manual Mode Layout
                <form onSubmit={handleCreateTask} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Task Title</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all placeholder:text-slate-300"
                      placeholder="E.g. Analyze server memory leak"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Description</label>
                    <textarea
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all min-h-[100px] resize-none placeholder:text-slate-300"
                      placeholder="Add details about this task..."
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Assignee (Staff)</label>
                      <select
                        required
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all"
                        value={newTask.assignedTo}
                        onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                      >
                        <option value="">Select Staff Member</option>
                        {staffList.map((staff: any) => (
                          <option key={staff._id} value={staff._id}>
                            {staff.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Due Date</label>
                      <input
                        type="datetime-local"
                        required
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all text-slate-500"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="w-full h-14 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black font-heading text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                  >
                    {modalLoading ? "Creating Task..." : "Confirm & Launch Task"}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TasksPage;
