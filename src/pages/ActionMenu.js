import { useState, useRef, useEffect } from "react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";

export default function ActionMenu({ 
  actions, 
  onView, 
  onSuspend, 
  onResetPassword, 
  onDelete, 
  onViewUser,
  onViewProduct,
  onUpdateStatus,
  member, 
  order,
  orderStatuses = []
}) {
  const [open, setOpen] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setShowStatusDropdown(false);
      }
    }
    if (open || showStatusDropdown) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, showStatusDropdown]);

  // Handle both old format (actions array) and new format (individual props)
  const menuActions = actions || [
    // Member actions
    ...(member ? [
      { label: "View Profile", onClick: onView },
      { label: member?.status === "Active" ? "Suspend" : "Activate", onClick: onSuspend },
      { label: "Reset Password", onClick: onResetPassword },
      { label: "Delete", onClick: onDelete },
    ] : []),
    // Order actions
    ...(order ? [
      { label: "View Order", onClick: onView },
      { label: "View User", onClick: onViewUser },
      { label: "View Product", onClick: onViewProduct },
    ] : []),
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
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg py-2 z-50 border border-gray-100 dark:border-slate-700">
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
          
          {/* Status dropdown for orders */}
          {order && orderStatuses.length > 0 && (
            <>
              <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>
              <div className="relative">
                <button
                  className="w-full text-left px-4 py-2 hover:bg-purple-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm"
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  type="button"
                >
                  Update Status
                </button>
                {showStatusDropdown && (
                  <div className="absolute left-full top-0 ml-1 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-lg py-1 border border-gray-100 dark:border-slate-700">
                    {orderStatuses.map((status) => (
                      <button
                        key={status}
                        className="w-full text-left px-3 py-1 hover:bg-purple-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs"
                        onClick={() => { 
                          setShowStatusDropdown(false); 
                          setOpen(false);
                          onUpdateStatus(status);
                        }}
                        type="button"
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
} 