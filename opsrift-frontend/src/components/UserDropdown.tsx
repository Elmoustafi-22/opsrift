import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserDropdown = ({ isOpen, onClose }: UserDropdownProps) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleLogout = () => {
    logout();
    onClose();
    navigate("/login");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 top-12 w-64 bg-white rounded-3xl shadow-2xl ring-1 ring-slate-200 z-50 overflow-hidden"
        >
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <p className="text-sm font-bold text-slate-900 leading-none">
              {user?.name}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-1.5 truncate">
              {user?.email}
            </p>
          </div>

          <div className="p-2.5">
            <Link
              to="/profile"
              onClick={onClose}
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <User size={19} />
                </div>
                <span className="text-sm font-semibold text-slate-700">My Profile</span>
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl hover:bg-red-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <LogOut size={19} />
                </div>
                <span className="text-sm font-semibold text-red-600">Sign Out</span>
              </div>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserDropdown;
