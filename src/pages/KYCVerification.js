import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import ActionMenu from "./ActionMenu";

const dummyKYC = [
  { id: 1, member: "Rahul Sharma", doc: "PAN", docNumber: "ABCDE1234F", upload: "2024-06-01", status: "Pending", img: "https://dummyimage.com/400x200/8b5cf6/fff&text=PAN+Card" },
  { id: 2, member: "Priya Singh", doc: "Aadhaar", docNumber: "1234-5678-9012", upload: "2024-06-02", status: "Approved", img: "https://dummyimage.com/400x200/10b981/fff&text=Aadhaar+Card" },
  { id: 3, member: "Amit Patel", doc: "PAN", docNumber: "FGHIJ5678K", upload: "2024-06-03", status: "Rejected", img: "https://dummyimage.com/400x200/f59e42/fff&text=PAN+Card" },
  { id: 4, member: "Maya Verma", doc: "Aadhaar", docNumber: "2345-6789-0123", upload: "2024-06-04", status: "Pending", img: "https://dummyimage.com/400x200/6366f1/fff&text=Aadhaar+Card" },
];

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

export default function KYCVerification() {
  const [kycList, setKycList] = useState(dummyKYC);
  const [modal, setModal] = useState({ open: false, kyc: null, type: null }); // type: 'view' | 'reject' | 'bulk-reject'
  const [remarks, setRemarks] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);

  // Filtered list
  const filtered = kycList.filter(k =>
    (!search || k.member.toLowerCase().includes(search.toLowerCase()) || k.docNumber.toLowerCase().includes(search.toLowerCase()))
  );

  // Bulk select logic
  const allSelected = filtered.length > 0 && filtered.every(k => selected.includes(k.id));
  const toggleAll = () => setSelected(allSelected ? [] : filtered.map(k => k.id));
  const toggleOne = (id) => setSelected(selected.includes(id) ? selected.filter(i => i !== id) : [...selected, id]);

  // Action handlers
  const handleApprove = (id) => setKycList((prev) => prev.map((k) => k.id === id ? { ...k, status: "Approved" } : k));
  const handleReject = (id, remarks) => setKycList((prev) => prev.map((k) => k.id === id ? { ...k, status: "Rejected", remarks } : k));
  // Bulk actions
  const handleBulkApprove = () => setKycList((prev) => prev.map((k) => selected.includes(k.id) ? { ...k, status: "Approved" } : k));
  const handleBulkReject = (remarks) => setKycList((prev) => prev.map((k) => selected.includes(k.id) ? { ...k, status: "Rejected", remarks } : k));

  // Export to Excel
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered.map(({ member, doc, docNumber, upload, status }) => ({ member, doc, docNumber, upload, status })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KYC");
    XLSX.writeFile(wb, "kyc-verification.xlsx");
  };
  // Export to PDF
  const handleExportPDF = async () => {
    const table = document.getElementById("kyc-table");
    if (!table) return;
    const canvas = await html2canvas(table);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape" });
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 10, width, height);
    pdf.save("kyc-verification.pdf");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 sm:p-8"
    >
      <h1 className="text-2xl font-bold mb-6">KYC Verification</h1>
      {/* Search & Bulk Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by member or document number"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 w-full md:w-80"
        />
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
          <button
            disabled={selected.length === 0}
            onClick={handleBulkApprove}
            className="px-4 py-2 rounded-lg font-semibold text-green-700 bg-green-100 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Approve Selected
          </button>
          <button
            disabled={selected.length === 0}
            onClick={() => setModal({ open: true, kyc: null, type: 'bulk-reject' })}
            className="px-4 py-2 rounded-lg font-semibold text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reject Selected
          </button>
        </div>
      </div>
      {/* Data Table: Scrollable Card */}
      <div className="overflow-x-auto rounded-lg shadow mb-8 max-h-[400px] overflow-y-auto">
        <table id="kyc-table" className="min-w-full bg-white dark:bg-slate-800">
          <thead>
            <tr className="bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm">
              <th className="py-3 px-4 text-center">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="py-3 px-4 text-left">Member</th>
              <th className="py-3 px-4 text-center">PAN / Aadhaar</th>
              <th className="py-3 px-4 text-center">Upload Date</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500">No KYC records found.</td>
              </tr>
            ) : (
              filtered.map((k) => (
                <tr key={k.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-slate-700 transition">
                  <td className="py-3 px-4 text-center">
                    <input type="checkbox" checked={selected.includes(k.id)} onChange={() => toggleOne(k.id)} />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-medium">{k.member}</td>
                  <td className="py-3 px-4 text-center">{k.doc} <span className="text-xs text-slate-400">({k.docNumber})</span></td>
                  <td className="py-3 px-4 text-center">{k.upload}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[k.status]}`}>{k.status}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <ActionMenu
                      actions={[
                        { label: "View", onClick: () => setModal({ open: true, kyc: k, type: 'view' }) },
                        ...(k.status === "Pending" ? [
                          { label: "Approve", onClick: () => handleApprove(k.id) },
                          { label: "Reject", onClick: () => setModal({ open: true, kyc: k, type: 'reject' }) },
                        ] : [])
                      ]}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Modal for View/Reject/Bulk Reject */}
      <AnimatePresence>
        {modal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 w-full max-w-md mx-2 relative"
            >
              <button
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                onClick={() => { setModal({ open: false, kyc: null, type: null }); setRemarks(""); }}
                aria-label="Close"
              >
                ×
              </button>
              {modal.type === 'view' && modal.kyc && (
                <div>
                  <h2 className="text-lg font-bold mb-2">KYC Document</h2>
                  <img src={modal.kyc.img} alt="KYC Document" className="rounded-lg w-full mb-4" />
                  <div className="mb-2"><span className="font-semibold">Member:</span> {modal.kyc.member}</div>
                  <div className="mb-2"><span className="font-semibold">Type:</span> {modal.kyc.doc}</div>
                  <div className="mb-2"><span className="font-semibold">Number:</span> {modal.kyc.docNumber}</div>
                  <div className="mb-2"><span className="font-semibold">Upload Date:</span> {modal.kyc.upload}</div>
                  <div className="mb-2"><span className="font-semibold">Status:</span> <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[modal.kyc.status]}`}>{modal.kyc.status}</span></div>
                </div>
              )}
              {(modal.type === 'reject' && modal.kyc) && (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleReject(modal.kyc.id, remarks);
                    setModal({ open: false, kyc: null, type: null });
                    setRemarks("");
                  }}
                >
                  <h2 className="text-lg font-bold mb-2">Reject KYC</h2>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Remarks</label>
                    <textarea
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => { setModal({ open: false, kyc: null, type: null }); setRemarks(""); }}
                      className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-semibold"
                    >
                      Reject
                    </button>
                  </div>
                </form>
              )}
              {modal.type === 'bulk-reject' && (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleBulkReject(remarks);
                    setModal({ open: false, kyc: null, type: null });
                    setRemarks("");
                    setSelected([]);
                  }}
                >
                  <h2 className="text-lg font-bold mb-2">Reject Selected KYC</h2>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Remarks</label>
                    <textarea
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => { setModal({ open: false, kyc: null, type: null }); setRemarks(""); }}
                      className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-semibold"
                    >
                      Reject All
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 