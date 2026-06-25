import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, CheckCircle2, X, Clock, Trash2, Sparkles } from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { cn } from "../utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";

const TaskDetailsPage = () => {
  const { user } = useAuthStore();
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [draft, setDraft] = useState("");
  const [outcome, setOutcome] = useState("");
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  // Smart Doc Reviewer States
  const [warningMessage, setWarningMessage] = useState("");
  const [checkingNotes, setCheckingNotes] = useState(false);
  const [refining, setRefining] = useState(false);

  const fetchTaskData = async () => {
    try {
      setLoading(true);
      const taskRes = await axiosInstance.get(`/tasks/${id}`);
      setTask(taskRes.data);
    } catch (err) {
      console.error("Error fetching task data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      return;
    }

    try {
      await axiosInstance.delete(`/tasks/${id}`);
      navigate("/tasks");
    } catch (err) {
      console.error("Failed to delete task:", err);
      alert("Failed to delete task. Please try again.");
    }
  };

  useEffect(() => {
    fetchTaskData();
  }, [id]);

  const handleOpenSubmitDialog = () => {
    setIsSubmitDialogOpen(true);
    setWarningMessage("");
    setDraft("");
    setOutcome("");
    setError("");
  };

  const handleRefineNotes = async () => {
    if (!draft.trim()) return;
    setRefining(true);
    try {
      const res = await axiosInstance.post("/docs/refine-notes", {
        notes: draft,
        taskTitle: task?.title || "Task",
      });
      setDraft(res.data.refinedNotes || draft);
      if (res.data.suggestedOutcome) {
        setOutcome(res.data.suggestedOutcome);
      }
    } catch (err) {
      console.error("Failed to refine notes:", err);
    } finally {
      setRefining(false);
    }
  };

  const handleNotesBlur = async () => {
    if (!draft.trim()) {
      setWarningMessage("");
      return;
    }
    setCheckingNotes(true);
    try {
      const res = await axiosInstance.post("/docs/review-notes", {
        notes: draft,
        taskTitle: task?.title || "Task Document",
      });
      if (res.data.isVague) {
        setWarningMessage(
          res.data.warningMessage ||
            "Your notes are brief — consider adding what was done, how it went, and any follow-up needed."
        );
      } else {
        setWarningMessage("");
      }
    } catch (err) {
      console.error("Failed to validate doc notes:", err);
      setWarningMessage("");
    } finally {
      setCheckingNotes(false);
    }
  };

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || !outcome) {
      setError("Draft content and outcome details are required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await axiosInstance.post("/docs", {
        taskId: id,
        notes: draft,
        outcome: outcome,
      });
      setIsSubmitDialogOpen(false);
      fetchTaskData();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to submit task documentation."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;

    // Simple regex for bold, italic and subheadings
    let formatted = text.split("\n").map((line, i) => {
      if (line.startsWith("### ")) {
        return (
          <h4 key={i} className="text-lg font-bold text-neutral-900 mt-6 mb-2">
            {line.replace("### ", "")}
          </h4>
        );
      }

      // Handle bold **text**
      const boldParts = line.split(/\*\*(.*?)\*\*/g);
      const formattedLine = boldParts.map((part, j) => {
        if (j % 2 === 1)
          return (
            <strong key={j} className="font-bold text-black">
              {part}
            </strong>
          );

        // Handle italic *text*
        const italicParts = part.split(/\*(.*?)\*/g);
        return italicParts.map((iPart, k) => {
          if (k % 2 === 1)
            return (
              <em key={k} className="italic text-neutral-800">
                {iPart}
              </em>
            );
          return iPart;
        });
      });

      return (
        <p key={i} className="mb-2 leading-relaxed">
          {formattedLine}
        </p>
      );
    });

    return <div>{formatted}</div>;
  };

  if (loading)
    return (
      <div className="p-8 animate-pulse text-center">
        Loading task details...
      </div>
    );
  if (!task)
    return <div className="p-8 text-center text-red-500">Task not found.</div>;

  const isCompleted = task.status === "done";

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-all font-bold text-sm border-none bg-transparent cursor-pointer self-start"
        >
          <div className="p-2 bg-white rounded-xl border border-slate-100 group-hover:border-slate-200 shadow-sm transition-all">
            <ArrowLeft size={18} />
          </div>
          Back to Tasks
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6 md:space-y-10">
          <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-slate-100 p-6 md:p-10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-100/50 transition-colors" />
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-6 mb-6 md:mb-8">
                <div>
                  <h1 className="text-xl md:text-3xl font-black font-heading text-slate-900 tracking-tight leading-tight">
                    {task.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-[10px] font-black font-heading uppercase tracking-widest">
                    <span className="flex items-center gap-2 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <Calendar size={14} className="text-slate-300" />
                      Deadline: {new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span
                      className={cn(
                        "px-3 py-1.5 rounded-xl border shadow-sm",
                        task.status === "done"
                          ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                          : "bg-indigo-50 border-indigo-100 text-indigo-700"
                      )}
                    >
                      {task.status || "pending"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="prose prose-slate max-w-none">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-5 md:w-1.5 md:h-6 bg-indigo-600 rounded-full" />
                  <h3 className="text-[10px] md:text-xs font-black font-heading text-slate-400 uppercase tracking-[0.2em]">
                    Task Briefing
                  </h3>
                </div>
                <div className="text-slate-600 leading-relaxed text-sm md:text-lg font-medium mb-8 md:mb-10">
                  {renderFormattedText(task.description)}
                </div>

                {task.aiBreakdown && (
                  <div className="mt-8 border-t border-slate-100 pt-8 animate-in fade-in duration-500">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-1 h-5 md:w-1.5 md:h-6 bg-indigo-500 rounded-full" />
                      <h3 className="text-[10px] md:text-xs font-black font-heading text-indigo-500 uppercase tracking-[0.2em]">
                        AI Operational Guidelines & Suggestions
                      </h3>
                    </div>
                    <div className="text-slate-600 leading-relaxed text-sm md:text-base font-medium whitespace-pre-line bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      {renderFormattedText(task.aiBreakdown)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!isCompleted ? (
            user && task?.assignedTo && (
              (typeof task.assignedTo === "object" && task.assignedTo._id === user.id) ||
              (typeof task.assignedTo === "string" && task.assignedTo === user.id)
            ) ? (
              <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-slate-100 p-6 md:p-10 shadow-sm flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
                <h3 className="text-lg md:text-xl font-black font-heading text-slate-900 mb-2">
                  Operational Task Awaiting Verification
                </h3>
                <p className="text-slate-500 text-sm font-medium mb-6 max-w-md">
                  Once you have performed the operations, trigger the documentation dialog to submit your outcomes and finalize the task.
                </p>
                
                <button
                  onClick={handleOpenSubmitDialog}
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-black font-heading transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 active:scale-95 cursor-pointer"
                >
                  Mark as Done & Document
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-slate-100 p-6 md:p-10 shadow-sm flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
                  <Clock size={24} />
                </div>
                <h3 className="text-lg md:text-xl font-black font-heading text-slate-900 mb-2">
                  Awaiting Operator Action
                </h3>
                <p className="text-slate-500 text-sm font-medium max-w-md">
                  This task is currently assigned to <span className="font-bold text-slate-700">{task.assignedTo?.name || "unassigned staff"}</span> and is awaiting their completion and documentation submission.
                </p>
              </div>
            )
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-50 rounded-2xl md:rounded-[3rem] p-8 md:p-12 text-center shadow-sm"
            >
              <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-xl md:rounded-[2rem] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 size={40} className="md:w-[48px] md:h-[48px] text-emerald-500" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black font-heading text-slate-900 tracking-tight">
                Task Documented & Finished
              </h2>
              <p className="text-slate-600 mt-3 md:mt-4 text-base md:text-lg font-medium max-w-md mx-auto">
                This operation is complete and verified with the system records.
              </p>
            </motion.div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm group">
            <h3 className="text-xs font-black font-heading text-slate-400 uppercase tracking-[0.2em] mb-8">
              Task Information
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-400">Status</span>
                <span
                  className={cn(
                    "text-xs font-black uppercase tracking-widest px-3 py-1 rounded-lg border",
                    task.status === "done"
                      ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                      : "bg-indigo-50 border-indigo-100 text-indigo-600"
                  )}
                >
                  {task.status || "pending"}
                </span>
              </div>
              {task.assignedTo && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-400">Operator</span>
                  <span className="text-sm font-black text-slate-900">
                    {task.assignedTo.name}
                  </span>
                </div>
              )}
              {task.createdBy && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-400">Created By</span>
                  <span className="text-sm font-black text-slate-900">
                    {task.createdBy.name}
                  </span>
                </div>
              )}
            </div>

            {user?.role === "admin" && (
              <button
                onClick={handleDeleteTask}
                className="w-full mt-6 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-xs font-black font-heading tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 border border-red-100 hover:border-red-200 active:scale-95 cursor-pointer"
              >
                <Trash2 size={14} /> Delete Task
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Document Submission Dialog Modal */}
      <AnimatePresence>
        {isSubmitDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSubmitDialogOpen(false)}
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
                    Document Task Outcomes
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Write your notes, then optionally refine with AI</p>
                </div>
                <button
                  onClick={() => setIsSubmitDialogOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  {error}
                </div>
              )}

              <form onSubmit={handleDocumentSubmit} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Your Completion Notes</label>
                    <button
                      type="button"
                      onClick={handleRefineNotes}
                      disabled={refining || !draft.trim()}
                      className={cn(
                        "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all",
                        draft.trim()
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-indigo-600/20 active:scale-95"
                          : "bg-slate-100 text-slate-300 cursor-not-allowed"
                      )}
                    >
                      {refining ? (
                        <>
                          <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          Refining…
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} />
                          AI Refine
                        </>
                      )}
                    </button>
                  </div>
                  
                  <textarea
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all min-h-[180px] resize-y placeholder:text-slate-300"
                    placeholder="Describe what you did, how it went, any issues encountered, and the result…"
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      if (warningMessage) setWarningMessage("");
                    }}
                    onBlur={handleNotesBlur}
                  />
                  {checkingNotes && (
                    <p className="text-[10px] text-indigo-500 mt-1 font-bold animate-pulse">
                      Checking documentation quality...
                    </p>
                  )}
                  {warningMessage && (
                    <div className="mt-2.5 p-3.5 bg-amber-50 text-amber-800 text-xs font-bold rounded-2xl border border-amber-100 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-ping" />
                      <p className="flex-1 leading-relaxed">{warningMessage}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Final Operational Outcome</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all placeholder:text-slate-300"
                    placeholder="E.g. Memory leak fixed (AI Refine will auto-fill this based on your notes)"
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsSubmitDialogOpen(false)}
                    className="flex-1 h-14 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-black font-heading text-xs uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black font-heading text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Outcomes & Done"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskDetailsPage;
