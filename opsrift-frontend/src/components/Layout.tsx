import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Bell,
  User as UserIcon,
  LogOut,
  X,
  CheckCircle2,
  Menu,
} from "lucide-react";
import { cn } from "../utils/cn";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import NotificationDropdown from "./NotificationDropdown";
import UserDropdown from "./UserDropdown";
import { motion } from "framer-motion";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && !isSidebarOpen) {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Set initial state correctly
    return () => window.removeEventListener("resize", handleResize);
  }, [isSidebarOpen]);

  // effectiveOpen is true if explicitly open OR currently hovered
  const effectiveOpen = isSidebarOpen || isHovered;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const { unreadCount, toggleDropdown, fetchNotifications } =
    useNotificationStore();

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Close sidebar on mobile route change
  React.useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
      setIsHovered(false);
    }
  }, [location.pathname, isMobile]);

  const handleMouseEnter = () => {
    if (!isMobile && !isSidebarOpen && !isHovered) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(true);
      }, 300);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Tasks", href: "/tasks", icon: CheckCircle2 },
    { name: "Profile", href: "/profile", icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Backdrop */}
      {effectiveOpen && isMobile && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 z-50",
          isMobile ? "fixed h-screen" : "sticky top-0 h-screen",
          effectiveOpen
            ? "translate-x-0 w-72"
            : "-translate-x-full md:translate-x-0 md:w-20"
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="p-6 flex items-center gap-3 justify-center relative">
          {effectiveOpen ? (
            <div className="flex items-center gap-3 w-full animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-heading font-black text-xl">
                O
              </div>
              <span className="font-heading font-black text-white tracking-tight text-xl">
                OpsRift
              </span>
            </div>
          ) : (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-0 border-0 bg-transparent cursor-pointer focus:outline-none w-full flex justify-center"
            >
              <div className="size-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-heading font-black text-lg hover:scale-110 transition-transform">
                O
              </div>
            </button>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-6 right-4 p-2 text-slate-400 hover:text-white transition-colors md:hidden"
          >
            <X size={20} />
          </button>

          {/* Desktop Toggle Button */}
          {effectiveOpen && !isMobile && (
            <button
              onClick={() => {
                setIsSidebarOpen(!isSidebarOpen);
                setIsHovered(false);
              }}
              className="hidden md:flex p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all absolute right-4"
            >
              <Menu size={18} />
            </button>
          )}
        </div>

        <nav className="flex-1 px-4 mt-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {links.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.name}
                to={link.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group relative overflow-hidden",
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                )}
              >
                <link.icon
                  className={cn(
                    "w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-400"
                  )}
                />
                {(effectiveOpen || !isMobile) && (
                  <span className="font-heading font-bold text-sm tracking-wide">
                    {link.name}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-indigo-600 -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 w-full px-4 py-3.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform shrink-0" />
            {(effectiveOpen || !isMobile) && (
              <span className="font-heading font-bold text-sm tracking-wide">
                Sign Out
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 md:h-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 px-4 md:px-10 flex items-center justify-between sticky top-0 z-30 transition-all">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-slate-600 p-2 hover:bg-slate-100 rounded-xl transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:block">
              <h2 className="text-xl font-heading font-black text-slate-900">
                {links.find((l) => l.href === location.pathname)?.name || "Dashboard"}
              </h2>
            </div>
            {isMobile && (
              <div className="md:hidden">
                <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-heading font-black">
                  O
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            <div className="relative group">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown();
                }}
                className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all relative"
              >
                <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 md:w-2.5 md:h-2.5 bg-indigo-600 rounded-full border-2 border-white animate-pulse shadow-sm"></span>
                )}
              </button>
              <NotificationDropdown />
            </div>
            
            <div className="h-6 md:h-8 w-px bg-slate-200/80 mx-1 md:mx-0"></div>
            
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsUserDropdownOpen(!isUserDropdownOpen);
                }}
                className="flex items-center gap-2 md:gap-3 pl-1 md:pl-2 pr-1 py-1 hover:bg-slate-50 rounded-[1.25rem] transition-all group"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {user?.name}
                  </p>
                </div>
                <div className="w-9 h-9 md:w-11 md:h-11 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-bold text-sm ring-2 md:ring-4 ring-slate-100 group-hover:ring-indigo-100 group-hover:bg-indigo-600 transition-all overflow-hidden shrink-0 shadow-sm">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      {user?.name?.[0]}
                    </span>
                  )}
                </div>
              </button>
              <UserDropdown
                isOpen={isUserDropdownOpen}
                onClose={() => setIsUserDropdownOpen(false)}
              />
            </div>
          </div>
        </header>

        <div className="p-4 md:p-10 pb-20 max-w-[1600px] mx-auto w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
