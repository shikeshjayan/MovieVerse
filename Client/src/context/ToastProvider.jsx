import { useContext } from "react";
import { Toaster, toast } from "sonner";
import { ThemeContext } from "./ThemeProvider";

const ToastProvider = ({ children }) => {
  const { theme } = useContext(ThemeContext);

  const isDark = theme === "dark";

  const toastStyles = {
    success: {
      style: {
        background: isDark ? "#052e16" : "#ecfdf5",
        border: isDark ? "1px solid #22c55e" : "1px solid #86efac",
        color: isDark ? "#86efac" : "#166534",
      },
      icon: "✅",
    },
    error: {
      style: {
        background: isDark ? "#450a0a" : "#fef2f2",
        border: isDark ? "1px solid #ef4444" : "1px solid #fca5a5",
        color: isDark ? "#fca5a5" : "#991b1b",
      },
      icon: "❌",
    },
    info: {
      style: {
        background: isDark ? "#172554" : "#eff6ff",
        border: isDark ? "1px solid #0064E0" : "1px solid #93c5fd",
        color: isDark ? "#93c5fd" : "#1e40af",
      },
      icon: "ℹ️",
    },
    warning: {
      style: {
        background: isDark ? "#451a03" : "#fefce8",
        border: isDark ? "1px solid #eab308" : "1px solid #fde047",
        color: isDark ? "#fde047" : "#854d0e",
      },
      icon: "⚠️",
    },
  };

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        theme={isDark ? "dark" : "light"}
        expand
        toastOptions={{
          style: {
            zIndex: 99999,
            fontFamily: "inherit",
          },
          success: toastStyles.success,
          error: toastStyles.error,
          info: toastStyles.info,
          warning: toastStyles.warning,
        }}
        closeButton
        visibleToasts={5}
      />
    </>
  );
};

export default ToastProvider;
