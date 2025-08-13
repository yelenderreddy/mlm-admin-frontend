// import React, { useState, useEffect, useCallback } from "react";
// import { ADMIN_ENDPOINTS, getAdminHeaders } from '../api-endpoints';
// import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

// function Toast({ message, onClose }) {
//   if (!message) return null;
//   return (
//     <div className="fixed top-6 right-6 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce-in">
//       {message}
//       <button className="ml-4 text-white font-bold" onClick={onClose}>×</button>
//     </div>
//   );
// }

// const SORT_FIELDS = [
//   { key: 'name', label: 'Name' },
//   { key: 'referralCount', label: 'Referral Count' },
//   { key: 'prize', label: 'Prize' }
// ];

// export default function Settings() {
//   const [milestones, setMilestones] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [toast, setToast] = useState("");
//   const [showModal, setShowModal] = useState(false);
//   const [editMilestone, setEditMilestone] = useState(null);
//   const [form, setForm] = useState({
//     name: '',
//     referralCount: '',
//     prize: '',
//     description: ''
//   });
//   const [search, setSearch] = useState("");
//   const [sortBy, setSortBy] = useState("referralCount");
//   const [sortDir, setSortDir] = useState("asc");

//   // Fetch milestones
//   const fetchMilestones = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const params = new URLSearchParams();
//       if (search) params.append('search', search);
//       if (sortBy) params.append('sortBy', sortBy);
//       if (sortDir) params.append('sortDir', sortDir);
//       const response = await fetch(`${ADMIN_ENDPOINTS.MILESTONES.LIST}?${params.toString()}`, {
//         headers: getAdminHeaders()
//       });
//       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
//       const data = await response.json();
//       setMilestones(Array.isArray(data) ? data : []);
//     } catch (err) {
//       setError(err.message);
//       setMilestones([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [search, sortBy, sortDir]);

//   useEffect(() => { fetchMilestones(); }, [fetchMilestones]);

//   // Handle form input
//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   // Handle add/edit submit
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const method = editMilestone ? 'PUT' : 'POST';
//       const url = editMilestone ? ADMIN_ENDPOINTS.MILESTONES.UPDATE(editMilestone.id) : ADMIN_ENDPOINTS.MILESTONES.CREATE;
//       const response = await fetch(url, {
//         method,
//         headers: getAdminHeaders(),
//         body: JSON.stringify({
//           name: form.name,
//           referralCount: Number(form.referralCount),
//           prize: form.prize,
//           description: form.description
//         })
//       });
//       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
//       setToast(editMilestone ? "Milestone updated!" : "Milestone added!");
//       setShowModal(false);
//       setForm({ name: '', referralCount: '', prize: '', description: '' });
//       setEditMilestone(null);
//       fetchMilestones();
//     } catch (err) {
//       setToast("Error: " + err.message);
//     }
//   };

//   // Handle edit
//   const handleEdit = (milestone) => {
//     setEditMilestone(milestone);
//     setForm({
//       name: milestone.name,
//       referralCount: milestone.referralCount,
//       prize: milestone.prize,
//       description: milestone.description || ''
//     });
//     setShowModal(true);
//   };

//   // Handle delete
//   const handleDelete = async (id) => {
//     if (!window.confirm("Delete this milestone?")) return;
//     try {
//       const response = await fetch(ADMIN_ENDPOINTS.MILESTONES.DELETE(id), {
//         method: 'DELETE',
//         headers: getAdminHeaders()
//       });
//       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
//       setToast("Milestone deleted!");
//       fetchMilestones();
//     } catch (err) {
//       setToast("Error: " + err.message);
//     }
//   };

//   // Handle modal close
//   const handleCloseModal = () => {
//     setShowModal(false);
//     setEditMilestone(null);
//     setForm({ name: '', referralCount: '', prize: '', description: '' });
//   };

//   // Handle sort
//   const handleSort = (field) => {
//     if (sortBy === field) {
//       setSortDir(sortDir === "asc" ? "desc" : "asc");
//     } else {
//       setSortBy(field);
//       setSortDir("asc");
//     }
//   };

//   // Handle enable/disable
//   const handleToggleActive = async (milestone) => {
//     try {
//       const response = await fetch(ADMIN_ENDPOINTS.MILESTONES.UPDATE(milestone.id) + '/active', {
//         method: 'PATCH',
//         headers: getAdminHeaders(),
//         body: JSON.stringify({ active: !milestone.active })
//       });
//       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
//       setToast(`Milestone ${milestone.active ? 'disabled' : 'enabled'}!`);
//       fetchMilestones();
//     } catch (err) {
//       setToast("Error: " + err.message);
//     }
//   };

//   return (
//     <div className="p-4 sm:p-8 max-w-4xl mx-auto">
//       <Toast message={toast} onClose={() => setToast("")} />
//       <h1 className="text-2xl font-bold mb-6">Milestone Management</h1>
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
//         <div className="flex-1">
//           <input
//             type="text"
//             placeholder="Search milestones by name or prize..."
//             value={search}
//             onChange={e => setSearch(e.target.value)}
//             className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white w-full"
//           />
//         </div>
//         <button
//           onClick={() => { setShowModal(true); setEditMilestone(null); setForm({ name: '', referralCount: '', prize: '', description: '' }); }}
//           className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
//         >
//           <PlusIcon className="w-5 h-5 mr-2" />
//           Add Milestone
//         </button>
//         </div>
//       {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">Error: {error}</div>}
//       <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-x-auto">
//         <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
//           <thead className="bg-gray-50 dark:bg-slate-700">
//             <tr>
//               {SORT_FIELDS.map(field => (
//                 <th
//                   key={field.key}
//                   className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none"
//                   onClick={() => handleSort(field.key)}
//                 >
//                   {field.label}
//                   {sortBy === field.key && (
//                     <span className="ml-1">{sortDir === "asc" ? "▲" : "▼"}</span>
//                   )}
//                 </th>
//               ))}
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
//               <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Active</th>
//               <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
//               </tr>
//             </thead>
//           <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
//             {loading ? (
//               <tr><td colSpan={7} className="px-6 py-4 text-center">Loading...</td></tr>
//             ) : milestones.length === 0 ? (
//               <tr><td colSpan={7} className="px-6 py-4 text-center text-gray-500">No milestones found.</td></tr>
//             ) : (
//               milestones.map(milestone => (
//                 <tr key={milestone.id}>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{milestone.name}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{milestone.referralCount}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-700 dark:text-purple-400">{milestone.prize}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{milestone.description}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-center">
//                     <button
//                       onClick={() => handleToggleActive(milestone)}
//                       className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${milestone.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'} transition`}
//                     >
//                       {milestone.active ? 'Enabled' : 'Disabled'}
//                     </button>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-center">
//                     <button onClick={() => handleEdit(milestone)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-2"><PencilIcon className="w-4 h-4" /></button>
//                     <button onClick={() => handleDelete(milestone.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"><TrashIcon className="w-4 h-4" /></button>
//                   </td>
//                 </tr>
//               ))
//             )}
//             </tbody>
//           </table>
//       </div>
//       {/* Add/Edit Modal */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="text-lg font-medium text-gray-900 dark:text-white">{editMilestone ? 'Edit Milestone' : 'Add Milestone'}</h3>
//               <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><XMarkIcon className="w-6 h-6" /></button>
//             </div>
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
//                 <input type="text" name="name" value={form.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white" />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Referral Count</label>
//                 <input type="number" name="referralCount" value={form.referralCount} onChange={handleChange} required min={1} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white" />
//                 </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prize</label>
//                 <input type="text" name="prize" value={form.prize} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white" />
//                 </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
//                 <textarea name="description" value={form.description} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-slate-700 dark:text-white" />
//                 </div>
//               <div className="flex justify-end space-x-3 pt-4">
//                 <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600">Cancel</button>
//                 <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">{editMilestone ? 'Update' : 'Add'}</button>
//                 </div>
//               </form>
//             </div>
//         </div>
//       )}
//     </div>
//   );
// } 
import React, { useState, useEffect, useCallback } from "react";

export default function Settings() {
  const [tab, setTab] = useState("privacy");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [privacyPolicy, setPrivacyPolicy] = useState("");
  const [privacyTitle, setPrivacyTitle] = useState("Privacy Policy");
  const [terms, setTerms] = useState("");
  const [termsTitle, setTermsTitle] = useState("Terms & Conditions");

  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqs, setFaqs] = useState([]);

  // API base URL
  const API_BASE_URL = "http://localhost:3000";

  // Helper function to show messages
  const showMessage = (msg, isError = false) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchExistingData = useCallback(async () => {
    try {
      // Fetch active privacy policy
      const privacyResponse = await fetch(`${API_BASE_URL}/privacy/active`, {
        headers: getAuthHeaders()
      });
      if (privacyResponse.ok) {
        const privacyData = await privacyResponse.json();
        if (privacyData.data) {
          setPrivacyPolicy(privacyData.data.content);
          setPrivacyTitle(privacyData.data.title);
        }
      }

      // Fetch active terms
      const termsResponse = await fetch(`${API_BASE_URL}/terms/active`, {
        headers: getAuthHeaders()
      });
      if (termsResponse.ok) {
        const termsData = await termsResponse.json();
        if (termsData.data) {
          setTerms(termsData.data.content);
          setTermsTitle(termsData.data.title);
        }
      }

      // Fetch FAQs
      const faqResponse = await fetch(`${API_BASE_URL}/faq/getAllFaqs`, {
        headers: getAuthHeaders()
      });
      if (faqResponse.ok) {
        const faqData = await faqResponse.json();
        if (faqData.data) {
          setFaqs(faqData.data);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, []);

  // Fetch existing data
  useEffect(() => {
    fetchExistingData();
  }, [fetchExistingData]);

  const handleAddFaq = async () => {
    if (faqQuestion && faqAnswer) {
      try {
        const response = await fetch(`${API_BASE_URL}/faq/createFaq`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            question: faqQuestion,
            answer: faqAnswer,
            category: "general"
          }),
        });

        if (response.ok) {
          showMessage("FAQ added successfully!");
          setFaqQuestion("");
          setFaqAnswer("");
          fetchExistingData(); // Refresh the list
        } else {
          showMessage("Failed to add FAQ", true);
        }
      } catch (error) {
        showMessage("Error adding FAQ", true);
      }
    }
  };

  const handleSubmitPrivacy = async () => {
    if (!privacyPolicy.trim()) {
      showMessage("Please enter privacy policy content", true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/privacy`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: privacyTitle,
          content: privacyPolicy,
          status: "active"
        }),
      });

      if (response.ok) {
        showMessage("Privacy Policy submitted successfully!");
        setPrivacyPolicy("");
        setPrivacyTitle("Privacy Policy");
      } else {
        showMessage("Failed to submit privacy policy", true);
      }
    } catch (error) {
      showMessage("Error submitting privacy policy", true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTerms = async () => {
    if (!terms.trim()) {
      showMessage("Please enter terms and conditions content", true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/terms`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: termsTitle,
          content: terms,
          status: "active"
        }),
      });

      if (response.ok) {
        showMessage("Terms & Conditions submitted successfully!");
        setTerms("");
        setTermsTitle("Terms & Conditions");
      } else {
        showMessage("Failed to submit terms and conditions", true);
      }
    } catch (error) {
      showMessage("Error submitting terms and conditions", true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.includes("Error") || message.includes("Failed") 
            ? "bg-red-100 text-red-700 border border-red-300" 
            : "bg-green-100 text-green-700 border border-green-300"
        }`}>
          {message}
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <button onClick={() => setTab("privacy")} className={`px-4 py-2 rounded ${tab === "privacy" ? "bg-purple-600 text-white" : "bg-gray-200"}`}>Privacy Policy</button>
        <button onClick={() => setTab("terms")} className={`px-4 py-2 rounded ${tab === "terms" ? "bg-purple-600 text-white" : "bg-gray-200"}`}>Terms & Conditions</button>
        <button onClick={() => setTab("faqs")} className={`px-4 py-2 rounded ${tab === "faqs" ? "bg-purple-600 text-white" : "bg-gray-200"}`}>FAQs</button>
      </div>

      {tab === "privacy" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Privacy Policy</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              className="w-full p-3 border rounded-md"
              value={privacyTitle}
              onChange={(e) => setPrivacyTitle(e.target.value)}
              placeholder="Enter privacy policy title..."
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              className="w-full h-60 p-4 border rounded-md"
              value={privacyPolicy}
              onChange={(e) => setPrivacyPolicy(e.target.value)}
              placeholder="Write your privacy policy here..."
            />
          </div>
          <button
            onClick={handleSubmitPrivacy}
            disabled={loading}
            className={`mt-4 px-4 py-2 text-white rounded-md ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {loading ? "Submitting..." : "Submit Privacy Policy"}
          </button>
        </div>
      )}

      {tab === "terms" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Terms & Conditions</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              className="w-full p-3 border rounded-md"
              value={termsTitle}
              onChange={(e) => setTermsTitle(e.target.value)}
              placeholder="Enter terms and conditions title..."
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              className="w-full h-60 p-4 border rounded-md"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Write your terms and conditions here..."
            />
          </div>
          <button
            onClick={handleSubmitTerms}
            disabled={loading}
            className={`mt-4 px-4 py-2 text-white rounded-md ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {loading ? "Submitting..." : "Submit Terms & Conditions"}
          </button>
        </div>
      )}

      {tab === "faqs" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">FAQs</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
              <input
                type="text"
                placeholder="Enter your question"
                value={faqQuestion}
                onChange={(e) => setFaqQuestion(e.target.value)}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Answer</label>
              <textarea
                placeholder="Enter the answer"
                value={faqAnswer}
                onChange={(e) => setFaqAnswer(e.target.value)}
                className="w-full px-4 py-2 border rounded-md h-32"
              />
            </div>
            <button
              onClick={handleAddFaq}
              disabled={loading}
              className={`px-4 py-2 text-white rounded-md ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {loading ? "Adding..." : "Submit FAQ"}
            </button>
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold">Existing FAQs</h3>
            {faqs.length === 0 ? (
              <p className="text-gray-500">No FAQs found. Add your first FAQ above.</p>
            ) : (
              faqs.map((faq, index) => (
                <div key={index} className="border p-4 rounded-md bg-gray-50">
                  <h4 className="font-semibold text-gray-900">Q: {faq.question}</h4>
                  <p className="text-gray-700 mt-2">A: {faq.answer}</p>
                  {faq.category && (
                    <span className="inline-block mt-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                      {faq.category}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}