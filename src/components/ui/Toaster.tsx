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
  info: { background: "rgba(55,65,81,0.9)", color: "#f9fafb" },
  success: { background: "rgba(22,163,74,0.9)", color: "#ecfdf5" },
  error: { background: "rgba(220,38,38,0.9)", color: "#fef2f2" },
};

export function ToasterProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const value = useMemo<ToasterContextValue>(() => ({ show }), [show]);

  return (
    <ToasterContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          alignItems: "flex-end",
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
                minWidth: 160,
                maxWidth: 260,
                padding: "6px 10px",
                borderRadius: 8,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                background: colors.background,
                color: colors.color,
                fontSize: 13,
                fontWeight: 500,
                pointerEvents: "auto",
                transition: "opacity 0.3s ease-in-out",
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
