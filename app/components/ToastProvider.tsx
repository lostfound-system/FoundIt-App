"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border backdrop-blur-md animate-in slide-in-from-right-full fade-in duration-300 min-w-[300px] max-w-sm
                            ${toast.type === "success"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
                                : toast.type === "error"
                                    ? "bg-red-500/10 border-red-500/20 text-red-200"
                                    : "bg-blue-500/10 border-blue-500/20 text-blue-200"
                            }`}
                    >
                        <div className={`p-1 rounded-full ${toast.type === "success" ? "bg-emerald-500/20" : toast.type === "error" ? "bg-red-500/20" : "bg-blue-500/20"}`}>
                            {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                            {toast.type === "error" && <AlertCircle className="w-5 h-5 text-red-400" />}
                            {toast.type === "info" && <Info className="w-5 h-5 text-blue-400" />}
                        </div>
                        <p className="text-sm font-medium flex-1">{toast.message}</p>
                        <button onClick={() => removeToast(toast.id)} className="opacity-50 hover:opacity-100 transition-opacity">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
