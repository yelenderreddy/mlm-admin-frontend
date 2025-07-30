import { useState, useRef, useEffect } from "react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";

export default function ActionMenu({ actions, onView, onSuspend, onResetPassword, onDelete, member }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Handle both old format (actions array) and new format (individual props)
  const menuActions = actions || [
    { label: "View Profile", onClick: onView },
    { label: member?.status === "Active" ? "Suspend" : "Activate", onClick: onSuspend },
    { label: "Reset Password", onClick: onResetPassword },
    { label: "Delete", onClick: onDelete },
  ].filter(action => action.onClick); // Only show actions that have onClick handlers

  return (
    <div className="relative" ref={ref}>
      <button
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
        onClick={() => setOpen((v) => !v)}
        aria-label="Actions"
        type="button"
      >
        <EllipsisVerticalIcon className="h-5 w-5 text-slate-500" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-lg py-2 z-50 border border-gray-100 dark:border-slate-700">
          {menuActions.map((a, i) => (
            <button
              key={i}
              className="w-full text-left px-4 py-2 hover:bg-purple-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm"
              onClick={() => { setOpen(false); a.onClick(); }}
              type="button"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 