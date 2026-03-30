import { useContext, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { ThemeContext } from "./ThemeProvider";

const ToastProvider = ({ children }) => {
  const { theme } = useContext(ThemeContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return children;

  const isDark = theme === "dark";

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        theme={isDark ? "dark" : "light"}
        expand
        richColors
        closeButton
        visibleToasts={5}
      />
    </>
  );
};

export default ToastProvider;
