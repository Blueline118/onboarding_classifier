import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastType = "info" | "success" | "error";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type ToasterContextValue = {
  show: (message: string, type?: ToastType) => void;
};

const ToasterContext = createContext<ToasterContextValue | null>(null);

const palette: Record<ToastType, { background: string; color: string }> = {
  info: { background: "#1f2937", color: "#f9fafb" },
  success: { background: "#14532d", color: "#bbf7d0" },
  error: { background: "#7f1d1d", color: "#fecaca" },
};

export function ToasterProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  const value = useMemo<ToasterContextValue>(() => ({ show }), [show]);

  return (
    <ToasterContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 1000,
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => {
          const colors = palette[toast.type];
          return (
            <div
              key={toast.id}
              role="status"
              style={{
                minWidth: 220,
                maxWidth: 320,
                padding: "10px 14px",
                borderRadius: 12,
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.2)",
                background: colors.background,
                color: colors.color,
                fontSize: 14,
                fontWeight: 500,
                pointerEvents: "auto",
              }}
            >
              {toast.message}
            </div>
          );
        })}
      </div>
    </ToasterContext.Provider>
  );
}

export function useToaster() {
  const context = useContext(ToasterContext);
  if (!context) {
    throw new Error("useToaster must be used within a ToasterProvider");
  }
  return context;
}