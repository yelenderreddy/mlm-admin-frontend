import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import ActionMenu from "./ActionMenu";

const dummyPayouts = [
  { id: 1, member: "Rahul Sharma", requested: 5000, approved: 5000, status: "Approved" },
  { id: 2, member: "Priya Singh", requested: 3000, approved: 0, status: "Pending" },
  { id: 3, member: "Amit Patel", requested: 2000, approved: 2000, status: "Approved" },
  { id: 4, member: "Maya Verma", requested: 4000, approved: 0, status: "Declined" },
];

const dummyWallets = [
  { id: 1, member: "Rahul Sharma", earned: 17000, pending: 0, balance: 2000 },
  { id: 2, member: "Priya Singh", earned: 12000, pending: 3000, balance: 5000 },
  { id: 3, member: "Amit Patel", earned: 15000, pending: 0, balance: 1000 },
  { id: 4, member: "Maya Verma", earned: 9000, pending: 0, balance: 4000 },
];

const statusColors = {
  Approved: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Declined: "bg-red-100 text-red-700",
};

const payoutStatuses = ["All", "Pending", "Approved", "Declined"];

export default function WalletsPayouts() {
  const [payouts, setPayouts] = useState(dummyPayouts);
  const [wallets] = useState(dummyWallets);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [toast, setToast] = useState(null);

  // Filtered payouts and wallets
  const filteredPayouts = payouts.filter(p =>
    (!search || p.member.toLowerCase().includes(search.toLowerCase())) &&
    (filterStatus === "All" || p.status === filterStatus)
  );
  const filteredWallets = wallets.filter(w =>
    !search || w.member.toLowerCase().includes(search.toLowerCase())
  );

  // Action handlers (dummy)
  const handleApprove = (id) => {
    setPayouts((prev) => prev.map((p) => p.id === id ? { ...p, status: "Approved", approved: p.requested } : p));
    setToast({ type: "success", message: "Payout approved!" });
  };
  const handleDecline = (id) => {
    setPayouts((prev) => prev.map((p) => p.id === id ? { ...p, status: "Declined", approved: 0 } : p));
    setToast({ type: "error", message: "Payout declined." });
  };
  const handleView = (id) => {
    // Placeholder for view action
    setToast({ type: "info", message: "View payout details for ID: " + id });
  };

  // Export to Excel
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredPayouts.map(({ member, requested, approved, status }) => ({ member, requested, approved, status })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payouts");
    XLSX.writeFile(wb, "payouts.xlsx");
  };
  // Export to PDF
  const handleExportPDF = async () => {
    const table = document.getElementById("payout-table");
    if (!table) return;
    const canvas = await html2canvas(table);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape" });
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 10, width, height);
    pdf.save("payouts.pdf");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 sm:p-8"
    >
      <h1 className="text-2xl font-bold mb-6">Wallets & Payouts</h1>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-lg shadow-lg font-semibold text-white ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}
            onAnimationComplete={() => setTimeout(() => setToast(null), 2000)}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by member name"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 w-full md:w-80"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 w-full md:w-60"
        >
          {payoutStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 transition-transform duration-200 text-sm"
          >
            Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 transition-transform duration-200 text-sm"
          >
            Export PDF
          </button>
        </div>
      </div>
      {/* Payout Requests Table */}
      <div className="mb-10">
        <div className="overflow-x-auto rounded-lg shadow mb-4">
          <table id="payout-table" className="min-w-full bg-white dark:bg-slate-800">
            <thead>
              <tr className="bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm">
                <th className="py-3 px-4 text-left">Member</th>
                <th className="py-3 px-4 text-center">Requested ₹</th>
                <th className="py-3 px-4 text-center">Approved ₹</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">No payout requests found.</td>
                </tr>
              ) : (
                filteredPayouts.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-slate-700 transition">
                    <td className="py-3 px-4 whitespace-nowrap font-medium">{p.member}</td>
                    <td className="py-3 px-4 text-center">₹{p.requested}</td>
                    <td className="py-3 px-4 text-center">₹{p.approved}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[p.status]}`}>{p.status}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <ActionMenu
                        actions={[
                          { label: "Approve", onClick: () => handleApprove(p.id) },
                          { label: "Decline", onClick: () => handleDecline(p.id) },
                          { label: "View", onClick: () => handleView(p.id) },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Member Wallet Overview Table */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Member Wallet Overview</h2>
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full bg-white dark:bg-slate-800">
            <thead>
              <tr className="bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm">
                <th className="py-3 px-4 text-left">Member</th>
                <th className="py-3 px-4 text-center">Total Earned</th>
                <th className="py-3 px-4 text-center">Pending Payouts</th>
                <th className="py-3 px-4 text-center">Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredWallets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">No wallet data found.</td>
                </tr>
              ) : (
                filteredWallets.map((w) => (
                  <tr key={w.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-slate-700 transition">
                    <td className="py-3 px-4 whitespace-nowrap font-medium">{w.member}</td>
                    <td className="py-3 px-4 text-center">₹{w.earned}</td>
                    <td className="py-3 px-4 text-center">₹{w.pending}</td>
                    <td className="py-3 px-4 text-center font-bold">₹{w.balance}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
} 