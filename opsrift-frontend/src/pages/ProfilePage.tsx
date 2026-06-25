import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Shield,
  Save,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Lock,
  X,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
} from "lucide-react";
import { useRef, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import Button from "../components/Button";
import Input from "../components/Input";
import axiosInstance from "../api/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";

const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.name ? user.name.split(" ")[0] : "",
    lastName: user?.name ? user.name.split(" ").slice(1).join(" ") : "",
    email: user?.email || "",
    phone: user?.profile?.phone || "",
    institution: user?.profile?.institution || "",
    courseOfStudy: user?.profile?.courseOfStudy || "",
    instagram: user?.profile?.instagram || "",
    twitter: user?.profile?.twitter || "",
    linkedin: user?.profile?.linkedin || "",
    facebook: user?.profile?.facebook || "",
    avatar: user?.avatar || user?.profile?.avatar || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.name ? user.name.split(" ")[0] : "",
        lastName: user.name ? user.name.split(" ").slice(1).join(" ") : "",
        email: user.email || "",
        phone: user.profile?.phone || "",
        institution: user.profile?.institution || "",
        courseOfStudy: user.profile?.courseOfStudy || "",
        instagram: user.profile?.instagram || "",
        twitter: user.profile?.twitter || "",
        linkedin: user.profile?.linkedin || "",
        facebook: user.profile?.facebook || "",
        avatar: user.avatar || user.profile?.avatar || "",
      }));
    }
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append(
      "upload_preset",
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    );

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        }/image/upload`,
        {
          method: "POST",
          body: uploadData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        setFormData((prev) => ({ ...prev, avatar: data.secure_url }));

        // Auto-save the avatar to the backend
        await axiosInstance.patch("/ambassador/me", {
          avatar: data.secure_url,
        });
        updateUser({ avatar: data.secure_url });

        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error?.message || "Cloudinary upload failed");
      }
    } catch (err: any) {
      console.error("Cloudinary Upload Error:", err);
      setError("Failed to upload image. Please check your connection.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const response = await axiosInstance.patch("/ambassador/me", {
        phone: formData.phone,
        avatar: formData.avatar,
        instagram: formData.instagram,
        twitter: formData.twitter,
        linkedin: formData.linkedin,
        facebook: formData.facebook,
        courseOfStudy: formData.courseOfStudy,
      });

      updateUser(response.data);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }

    setPasswordLoading(true);

    try {
      await axiosInstance.patch("/ambassador/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordSuccess(true);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (err: any) {
      setPasswordError(
        err.response?.data?.message || "Failed to change password"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="space-y-2">
        <h1 className="text-4xl font-black font-heading text-slate-900 tracking-tight">
          Personnel Profile
        </h1>
        <p className="text-slate-500 font-medium text-lg">
          Manage your operational credentials and account preferences.
        </p>
      </div>

      {(success || error) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-5 rounded-[2rem] flex items-center gap-4 font-black font-heading text-sm shadow-sm border ${
            success 
              ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
              : "bg-rose-50 text-rose-700 border-rose-100"
          }`}
        >
          {success ? (
            <div className="p-2 bg-white rounded-xl shadow-sm text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
          ) : (
            <div className="p-2 bg-white rounded-xl shadow-sm text-rose-600">
              <AlertCircle size={20} />
            </div>
          )}
          <span className="tracking-tight">
            {success ? "Operational profile updated successfully!" : error}
          </span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column - Card */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-24 bg-slate-50 border-b border-slate-100" />
            
            <div className="relative z-10">
              <div className="relative inline-block mb-6">
                <div className="w-36 h-36 bg-white rounded-[2.5rem] flex items-center justify-center text-4xl font-black border-8 border-white shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      {user?.name ? user.name.split(" ")[0]?.[0] || "" : ""}
                      {user?.name ? user.name.split(" ")[1]?.[0] || "" : ""}
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="animate-spin text-white" size={32} />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-2 right-2 p-3 bg-indigo-600 text-white rounded-2xl border-4 border-white shadow-xl hover:scale-110 active:scale-95 transition-all"
                >
                  <Camera size={20} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                  />
              </div>
              
              <h2 className="text-2xl font-black font-heading text-slate-900 tracking-tight">
                {user?.name}
              </h2>
              <p className="text-indigo-600 text-sm font-black font-heading uppercase tracking-[0.2em] mt-2 opacity-80">
                Official Fellow
              </p>

              <div className="mt-8 flex items-center justify-center gap-2.5 px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black font-heading uppercase tracking-widest border border-emerald-100 shadow-sm">
                <Shield size={14} /> Verified Credential
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <Shield className="text-indigo-400" size={24} />
                </div>
                <h3 className="text-xl font-black font-heading tracking-tight">Security Vault</h3>
              </div>
              <p className="text-sm text-slate-400 mb-8 leading-relaxed font-medium">
                Your operational data is protected by enterprise-grade encryption. Update your access codes regularly.
              </p>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full py-4 bg-white/5 hover:bg-white text-white hover:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-white/10 hover:border-white shadow-lg active:scale-95"
              >
                Reset Access Code
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Form & Certificate */}
        <div className="lg:col-span-2 space-y-10">

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm space-y-10"
          >
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                <h3 className="text-xs font-black font-heading text-slate-400 uppercase tracking-[0.2em]">
                  Personal Data
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input
                  label="First Name"
                  value={formData.firstName}
                  disabled
                  icon={<User size={18} />}
                />
                <Input
                  label="Last Name"
                  value={formData.lastName}
                  disabled
                  icon={<User size={18} />}
                />
              </div>

              <Input
                label="Primary Email"
                type="email"
                value={formData.email}
                disabled
                icon={<Mail size={18} />}
              />
            </div>

            <div className="h-px bg-slate-50 w-full" />

            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                <h3 className="text-xs font-black font-heading text-slate-400 uppercase tracking-[0.2em]">
                  Operational Info
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input
                  label="Contact Phone"
                  placeholder="+234 ..."
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  icon={<Phone size={18} />}
                />
                <Input
                  label="Home Institution"
                  placeholder="Institution Name"
                  value={formData.institution}
                  disabled
                  icon={<MapPin size={18} />}
                />
                <div className="md:col-span-2">
                  <Input
                    label="Active Specialization"
                    placeholder="Course of Study"
                    value={formData.courseOfStudy}
                    onChange={(e) =>
                      setFormData({ ...formData, courseOfStudy: e.target.value })
                    }
                    disabled={!!user?.profile?.courseOfStudy}
                    icon={<User size={18} />}
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-50 w-full" />

            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                <h3 className="text-xs font-black font-heading text-slate-400 uppercase tracking-[0.2em]">
                  Social Protocols
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input
                  label="Instagram Protocol"
                  placeholder="@username"
                  value={formData.instagram}
                  onChange={(e) =>
                    setFormData({ ...formData, instagram: e.target.value })
                  }
                  icon={<Instagram size={18} />}
                />
                <Input
                  label="Twitter Protocol"
                  placeholder="@username"
                  value={formData.twitter}
                  onChange={(e) =>
                    setFormData({ ...formData, twitter: e.target.value })
                  }
                  icon={<Twitter size={18} />}
                />
                <Input
                  label="LinkedIn Link"
                  placeholder="linkedin.com/in/username"
                  value={formData.linkedin}
                  onChange={(e) =>
                    setFormData({ ...formData, linkedin: e.target.value })
                  }
                  icon={<Linkedin size={18} />}
                />
                <Input
                  label="Facebook Link"
                  placeholder="facebook.com/username"
                  value={formData.facebook}
                  onChange={(e) =>
                    setFormData({ ...formData, facebook: e.target.value })
                  }
                  icon={<Facebook size={18} />}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              {success && (
                <div className="flex items-center gap-2 text-emerald-600 font-black font-heading text-[10px] uppercase tracking-widest animate-in fade-in slide-in-from-left-2">
                  <CheckCircle2 size={16} /> Changes Synchronized
                </div>
              )}
              <Button
                type="submit"
                className="ml-auto px-16 h-14 text-sm rounded-2xl shadow-xl shadow-indigo-600/20"
                isLoading={loading}
                rightIcon={<Save size={20} />}
              >
                Commit Changes
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[3rem] shadow-2xl max-w-lg w-full p-10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <button
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordError("");
                setPasswordSuccess(false);
                setPasswordData({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                });
              }}
              className="absolute top-8 right-8 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-900 z-20"
            >
              <X size={20} />
            </button>

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-indigo-600 rounded-[1.5rem] shadow-lg shadow-indigo-600/20 text-white">
                  <Lock size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black font-heading text-slate-900 tracking-tight">
                    Reset Credentials
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    Update your primary access code
                  </p>
                </div>
              </div>

              {passwordError && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-8 p-5 rounded-2xl bg-rose-50 text-rose-700 border border-rose-100 flex items-center gap-4 text-xs font-black font-heading tracking-tight"
                >
                  <AlertCircle size={20} />
                  {passwordError}
                </motion.div>
              )}

              {passwordSuccess && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-8 p-5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-4 text-xs font-black font-heading tracking-tight"
                >
                  <CheckCircle2 size={20} />
                  Access code synchronized!
                </motion.div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-6">
                <Input
                  label="Current Access Code"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  icon={<Lock size={18} />}
                  required
                />

                <Input
                  label="New Access Code"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  icon={<Lock size={18} />}
                  required
                />

                <Input
                  label="Confirm Access Code"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  icon={<Lock size={18} />}
                  required
                />

                <div className="flex gap-4 pt-8">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 h-14 bg-slate-50 hover:bg-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all"
                  >
                    Abort
                  </button>
                  <Button
                    type="submit"
                    className="flex-[2] h-14 rounded-2xl shadow-xl shadow-indigo-600/20"
                    isLoading={passwordLoading}
                    disabled={passwordLoading}
                  >
                    Commit Reset
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 right-10 z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-800"
          >
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 className="font-bold font-heading text-sm tracking-tight">Success</h4>
              <p className="text-xs text-slate-400 font-medium">Your profile details have been saved.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
