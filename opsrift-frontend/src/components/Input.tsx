import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, icon, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = type === "password";
    const inputType = isPasswordField && showPassword ? "text" : type;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-xs font-heading font-bold text-slate-500 uppercase tracking-widest ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={cn(
              "flex h-12 w-full rounded-2xl border border-slate-200 bg-white py-2 text-sm ring-offset-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 shadow-sm",
              icon ? "pl-11" : "pl-4",
              isPasswordField ? "pr-11" : "pr-4",
              error ? "border-red-500 focus-visible:ring-red-500/10 focus-visible:border-red-500/50" : "border-slate-200",
              className
            )}
            {...props}
          />
          {isPasswordField && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-neutral-500 ml-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
