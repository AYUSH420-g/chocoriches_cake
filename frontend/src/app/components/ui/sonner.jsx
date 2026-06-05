"use client";
import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";
const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme();
  return <Sonner
    theme={theme}
    className="toaster group"
    toastOptions={{
      classNames: {
        toast:
          "group toast group-[.toaster]:bg-white group-[.toaster]:text-[#1f2221] group-[.toaster]:border-[#ebebeb] group-[.toaster]:shadow-lg rounded-xl font-bold px-4 py-3 border-2 flex items-center gap-3",
        description: "group-[.toast]:text-[#6f7573] font-medium text-xs mt-1",
        actionButton:
          "group-[.toast]:bg-[#1f2221] group-[.toast]:text-white rounded-lg px-3 py-1.5 font-bold text-xs",
        cancelButton:
          "group-[.toast]:bg-[#f7f7f7] group-[.toast]:text-[#6f7573] rounded-lg px-3 py-1.5 font-bold text-xs",
        error: "group-[.toaster]:bg-red-50 group-[.toaster]:text-red-600 group-[.toaster]:border-red-200",
        success: "group-[.toaster]:bg-[#e8f8ef] group-[.toaster]:text-[#0f8b57] group-[.toaster]:border-[#0f8b57]/20",
        warning: "group-[.toaster]:bg-orange-50 group-[.toaster]:text-orange-600 group-[.toaster]:border-orange-200",
        info: "group-[.toaster]:bg-blue-50 group-[.toaster]:text-blue-600 group-[.toaster]:border-blue-200",
      },
    }}
    {...props}
  />;
};
export {
  Toaster
};
