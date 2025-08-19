// import { useEffect, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import * as XLSX from "xlsx";
// import html2canvas from "html2canvas";
// import { jsPDF } from "jspdf";
// import ActionMenu from "./ActionMenu";
// import { apiFetch } from "../api";

// const dummyOrders = [
//   { id: 1, member: "Rahul Sharma", product: "MLM Starter Kit", status: "Pending", delivery: "2024-06-10" },
//   { id: 2, member: "Priya Singh", product: "E-Book Guide", status: "Delivered", delivery: "2024-06-05" },
//   { id: 3, member: "Amit Patel", product: "Wellness Pack", status: "Shipped", delivery: "2024-06-08" },
//   { id: 4, member: "Maya Verma", product: "MLM Starter Kit", status: "Pending", delivery: "-" },
// ];

// const statusColors = {
//   Active: "bg-green-100 text-green-700",
//   Inactive: "bg-red-100 text-red-700",
//   Pending: "bg-yellow-100 text-yellow-700",
//   Delivered: "bg-green-100 text-green-700",
//   Shipped: "bg-blue-100 text-blue-700",
//   Cancelled: "bg-red-100 text-red-700",
// };

// export default function ProductManagement() {
//   const [products, setProducts] = useState([]);
//   const [orders] = useState(dummyOrders); // Orders integration will be handled later
//   const [search, setSearch] = useState("");
//   const [modal, setModal] = useState({ open: false, product: null, mode: null });
//   const [editFields, setEditFields] = useState({ name: "", price: "", description: "", rewardPoints: "", available: true, images: [], imagePreviews: [] });
//   const [inventoryHistory, setInventoryHistory] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Define fetchProducts function at the top of the component
//   const fetchProducts = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await apiFetch("/product");
//       if (!res.ok) throw new Error("Failed to fetch products");
//       const data = await res.json();
//       setProducts(data);
//     } catch (err) {
//       setError(err.message || "Error loading products");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // In useEffect, call fetchProducts
//   useEffect(() => {
//     fetchProducts();
//   }, []);

//   // Filtered products
//   const filtered = products.filter(p =>
//     (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.type.toLowerCase().includes(search.toLowerCase()))
//   );

//   // Export to Excel
//   const handleExportExcel = () => {
//     const ws = XLSX.utils.json_to_sheet(filtered.map(({ name, cost, type, inventory, status }) => ({ name, cost, type, inventory, status })));
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Products");
//     XLSX.writeFile(wb, "products.xlsx");
//   };
//   // Export to PDF
//   const handleExportPDF = async () => {
//     const table = document.getElementById("product-table");
//     if (!table) return;
//     const canvas = await html2canvas(table);
//     const imgData = canvas.toDataURL("image/png");
//     const pdf = new jsPDF({ orientation: "landscape" });
//     const width = pdf.internal.pageSize.getWidth();
//     const height = (canvas.height * width) / canvas.width;
//     pdf.addImage(imgData, "PNG", 0, 10, width, height);
//     pdf.save("products.pdf");
//   };

//   // Edit product
//   const openEdit = (product) => {
//     setEditFields(product);
//     setModal({ open: true, product });
//   };
//   const handleEditChange = (e) => {
//     const { name, value } = e.target;
//     setEditFields(f => ({ ...f, [name]: value }));
//   };
//   const handleEditSave = async (e) => {
//     e.preventDefault();
//     try {
//       // 1. Update product (JSON)
//       const res = await apiFetch(`/product/${editFields.id}`, {
//         method: "PATCH",
//         body: JSON.stringify({
//           name: editFields.name,
//           description: editFields.description,
//           price: Number(editFields.price),
//           rewardPoints: Number(editFields.rewardPoints),
//           available: editFields.available
//         }),
//         headers: { 'Content-Type': 'application/json' }
//       });
//       if (!res.ok) throw new Error("Failed to update product");
//       const updatedProduct = await res.json();
//       // 2. Upload images (FormData)
//       if (editFields.images.length > 0) {
//         const formData = new FormData();
//         editFields.images.forEach(img => formData.append('images', img));
//         await apiFetch(`/product/${updatedProduct.id}/images`, {
//           method: 'POST',
//           body: formData
//         });
//       }
//     setModal({ open: false, product: null });
//       fetchProducts();
//     } catch (err) {
//       alert(err.message || "Error updating product");
//     }
//   };

//   // Add Product
//   const openAdd = () => {
//     setEditFields({ name: "", price: "", description: "", rewardPoints: "", available: true, images: [], imagePreviews: [] });
//     setModal({ open: true, product: null, mode: "add" });
//   };

//   // Create product with the specified payload format
//   const createProduct = async (productData) => {
//     try {
//       const payload = {
//         products: [{
//           productName: productData.name,
//           productCount: 1, // Default value, can be adjusted
//           productCode: Math.floor(1000 + Math.random() * 9000), // Generate random code if not provided
//           productPrice: Number(productData.price)
//         }]
//       };

//       const res = await apiFetch("/api/products", { // Update the endpoint as per your API
//         method: "POST",
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming token is stored in localStorage
//         },
//         body: JSON.stringify(payload)
//       });

//       if (!res.ok) {
//         const errorData = await res.json();
//         throw new Error(errorData.message || "Failed to create product");
//       }

//       return await res.json();
//     } catch (error) {
//       console.error("Error creating product:", error);
//       throw error;
//     }
//   };

//   const handleAddSave = async (e) => {
//     e.preventDefault();
//     try {
//       // 1. Create product with the new payload format
//       const response = await createProduct({
//         name: editFields.name,
//         price: editFields.price,
//         description: editFields.description
//       });

//       // 2. If there are images, upload them
//       if (editFields.images.length > 0) {
//         const formData = new FormData();
//         editFields.images.forEach(img => formData.append('images', img));
        
//         // Assuming the API returns the created product ID in response.data[0].id
//         const productId = response.data?.[0]?.id;
//         if (productId) {
//           await apiFetch(`/product/${productId}/images`, {
//             method: 'POST',
//             body: formData
//           });
//         }
//       }

//       setModal({ open: false, product: null, mode: null });
//       fetchProducts();
      
//       // Show success message
//       alert(response.message || "Product created successfully!");
//     } catch (err) {
//       console.error("Error in handleAddSave:", err);
//       alert(err.message || "Error adding product");
//     }
//   };

//   // Delete Product
//   const handleDelete = async (id) => {
//     if (window.confirm("Are you sure you want to delete this product?")) {
//       try {
//         const res = await apiFetch(`/product/${id}`, { method: "DELETE" });
//         if (!res.ok) throw new Error("Failed to delete product");
//         setProducts((prev) => prev.filter((p) => p.id !== id));
//       } catch (err) {
//         alert(err.message || "Error deleting product");
//       }
//     }
//   };

//   // Inventory adjustment and history
//   const adjustInventory = (id, delta) => {
//     setProducts(prev => prev.map(p => {
//       if (p.id === id && p.type === "Physical" && p.inventory !== "Unlimited") {
//         const newInv = Math.max(0, Number(p.inventory) + delta);
//         // Log history
//         setInventoryHistory(h => ({
//           ...h,
//           [id]: [
//             ...(h[id] || []),
//             { date: new Date().toISOString(), change: delta, newValue: newInv }
//           ]
//         }));
//         return { ...p, inventory: newInv };
//       }
//       return p;
//     }));
//   };
//   const [historyModal, setHistoryModal] = useState({ open: false, id: null });

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 30 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5 }}
//       className="p-4 sm:p-8"
//     >
//       <h1 className="text-2xl font-bold mb-6">Product Management</h1>
//       {/* Search, Add & Export */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
//         <div className="flex gap-2 w-full md:w-auto">
//           <input
//             type="text"
//             placeholder="Search by product name or type"
//             value={search}
//             onChange={e => setSearch(e.target.value)}
//             className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 w-full md:w-80"
//           />
//           <button
//             onClick={openAdd}
//             className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 transition-transform duration-200 text-sm whitespace-nowrap"
//           >
//             + Add Product
//           </button>
//         </div>
//         <div className="flex gap-2 flex-wrap">
//           <button
//             onClick={handleExportExcel}
//             className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 transition-transform duration-200 text-sm"
//           >
//             Export Excel
//           </button>
//           <button
//             onClick={handleExportPDF}
//             className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 transition-transform duration-200 text-sm"
//           >
//             Export PDF
//           </button>
//         </div>
//       </div>
//       {/* Product Table */}
//       <div className="mb-10">
//         <h2 className="text-lg font-semibold mb-3">Products</h2>
//         {loading ? (
//           <div className="py-6 text-center text-slate-500">Loading products...</div>
//         ) : error ? (
//           <div className="py-6 text-center text-red-500">{error}</div>
//         ) : (
//         <div className="overflow-x-auto rounded-lg shadow mb-4">
//           <table id="product-table" className="min-w-full bg-white dark:bg-slate-800">
//             <thead>
//               <tr className="bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm">
//                 <th className="py-3 px-4 text-left">Product Name</th>
//                 <th className="py-3 px-4 text-left">Description</th>
//                 <th className="py-3 px-4 text-center">Price</th>
//                 <th className="py-3 px-4 text-center">Reward Points</th>
//                 <th className="py-3 px-4 text-center">Available</th>
//                 <th className="py-3 px-4 text-center">Image</th>
//                 <th className="py-3 px-4 text-center">Action</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filtered.length === 0 ? (
//                 <tr>
//                   <td colSpan={7} className="py-6 text-center text-slate-500">No products found.</td>
//                 </tr>
//               ) : (
//                 filtered.map((p) => (
//                   <tr key={p.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-slate-700 transition">
//                     <td className="py-3 px-4 whitespace-nowrap font-medium">{p.name}</td>
//                     <td className="py-3 px-4">{p.description}</td>
//                     <td className="py-3 px-4 text-center">₹{p.price}</td>
//                     <td className="py-3 px-4 text-center">{p.rewardPoints}</td>
//                     <td className="py-3 px-4 text-center">{p.available ? 'Yes' : 'No'}</td>
//                     <td className="py-3 px-4 text-center">
//                       {p.images && p.images.length > 0 ? (
//                         <img src={`http://localhost:3001/product/images/${p.images[0].id}`} alt="thumb" className="h-12 w-12 object-cover rounded" />
//                       ) : (
//                         <span style={{ color: '#aaa' }}>No image</span>
//                       )}
//                     </td>
//                     <td className="py-3 px-4 text-center flex gap-2 justify-center">
//                       <ActionMenu
//                         actions={[
//                           { label: "Edit", onClick: () => openEdit(p) },
//                           { label: "Delete", onClick: () => handleDelete(p.id) },
//                         ]}
//                       />
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//         )}
//       </div>
//       {/* User Orders Table */}
//       <div>
//         <h2 className="text-lg font-semibold mb-3">User Orders</h2>
//         <div className="overflow-x-auto rounded-lg shadow">
//           <table className="min-w-full bg-white dark:bg-slate-800">
//             <thead>
//               <tr className="bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm">
//                 <th className="py-3 px-4 text-left">Member</th>
//                 <th className="py-3 px-4 text-center">Product</th>
//                 <th className="py-3 px-4 text-center">Status</th>
//                 <th className="py-3 px-4 text-center">Delivery Date</th>
//                 <th className="py-3 px-4 text-center">Action</th>
//               </tr>
//             </thead>
//             <tbody>
//               {orders.length === 0 ? (
//                 <tr>
//                   <td colSpan={5} className="py-6 text-center text-slate-500">No orders found.</td>
//                 </tr>
//               ) : (
//                 orders.map((o) => (
//                   <tr key={o.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-slate-700 transition">
//                     <td className="py-3 px-4 whitespace-nowrap font-medium">{o.member}</td>
//                     <td className="py-3 px-4 text-center">{o.product}</td>
//                     <td className="py-3 px-4 text-center">
//                       <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[o.status]}`}>{o.status}</span>
//                     </td>
//                     <td className="py-3 px-4 text-center">{o.delivery}</td>
//                     <td className="py-3 px-4 text-center">
//                       <div className="flex flex-row flex-wrap sm:flex-nowrap items-center justify-center rounded-md shadow-sm border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 overflow-hidden divide-x divide-gray-200 dark:divide-slate-700">
//                         {o.status === "Pending" && (
//                           <button className="px-4 py-1 text-xs font-medium text-green-600 bg-transparent hover:bg-green-50 dark:hover:bg-slate-800 focus:z-10 focus:outline-none transition whitespace-nowrap">Mark Delivered</button>
//                         )}
//                         {o.status === "Pending" && (
//                           <button className="px-4 py-1 text-xs font-medium text-red-600 bg-transparent hover:bg-red-50 dark:hover:bg-slate-800 focus:z-10 focus:outline-none transition whitespace-nowrap">Cancel</button>
//                         )}
//                         <button className="px-4 py-1 text-xs font-medium text-blue-600 bg-transparent hover:bg-blue-50 dark:hover:bg-slate-800 focus:z-10 focus:outline-none transition whitespace-nowrap">View</button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//       {/* Edit Product Modal */}
//       <AnimatePresence>
//         {modal.open && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
//           >
//             <motion.form
//               initial={{ scale: 0.95, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.95, opacity: 0 }}
//               onSubmit={handleEditSave}
//               className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 w-full max-w-2xl mx-2 relative flex flex-col justify-center items-center max-h-[90vh] overflow-y-auto"
//             >
//               <button
//                 className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
//                 onClick={() => setModal({ open: false, product: null })}
//                 aria-label="Close"
//                 type="button"
//               >
//                 ×
//               </button>
//               <h2 className="text-lg font-bold mb-4">Edit Product</h2>
//               <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="flex flex-col gap-4">
//                   <div>
//                     <label className="block font-semibold mb-1">Product Name<span className="text-red-500">*</span></label>
//                     <input name="name" value={editFields.name || ""} onChange={handleEditChange} required className="w-full h-10 px-3 rounded border border-gray-200 focus:ring-2 focus:ring-purple-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
//                   </div>
//                   <div>
//                     <label className="block font-semibold mb-1">Price<span className="text-red-500">*</span></label>
//                     <input name="price" type="number" min="0" value={editFields.price || ""} onChange={handleEditChange} required className="w-full h-10 px-3 rounded border border-gray-200 focus:ring-2 focus:ring-purple-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
//                   </div>
//                   <div className="flex items-center gap-2 mt-2">
//                     <input name="available" type="checkbox" checked={editFields.available} onChange={() => setEditFields(f => ({ ...f, available: !f.available }))} className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
//                     <label className="font-semibold">Available</label>
//                   </div>
//                 </div>
//                 <div className="flex flex-col gap-4">
//                   <div>
//                     <label className="block font-semibold mb-1">Reward Points<span className="text-red-500">*</span></label>
//                     <input name="rewardPoints" type="number" min="0" value={editFields.rewardPoints || ""} onChange={handleEditChange} required className="w-full h-10 px-3 rounded border border-gray-200 focus:ring-2 focus:ring-purple-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
//                   </div>
//                   <div>
//                     <label className="block font-semibold mb-1">Description<span className="text-red-500">*</span></label>
//                     <textarea name="description" value={editFields.description || ""} onChange={handleEditChange} required className="w-full min-h-[80px] px-3 py-2 rounded border border-gray-200 focus:ring-2 focus:ring-purple-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
//                   </div>
//                   <div>
//                     <label className="block font-semibold mb-1">Images</label>
//                     <input type="file" multiple accept="image/*" onChange={e => { const files = Array.from(e.target.files); setEditFields(f => ({ ...f, images: files, imagePreviews: files.map(file => URL.createObjectURL(file)) })); }} className="w-full" />
//                     <div className="flex gap-2 mt-2 flex-wrap">
//                       {editFields.imagePreviews && editFields.imagePreviews.map((src, idx) => (
//                         <div key={idx} className="relative group">
//                           <img src={src} alt="preview" className="h-16 w-16 object-cover rounded border" />
//                           <button type="button" onClick={() => setEditFields(f => ({ ...f, images: f.images.filter((_, i) => i !== idx), imagePreviews: f.imagePreviews.filter((_, i) => i !== idx) }))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-80 group-hover:opacity-100">×</button>
//               </div>
//                       ))}
//               </div>
//               </div>
//               </div>
//               </div>
//               <div className="flex gap-4 mt-8 w-full justify-end">
//                 <button type="button" onClick={() => setModal({ open: false, product: null })} className="px-6 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 font-semibold">Cancel</button>
//                 <button type="submit" className="px-6 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 font-semibold">Save</button>
//               </div>
//             </motion.form>
//           </motion.div>
//         )}
//       </AnimatePresence>
//       {/* Add Product Modal */}
//       <AnimatePresence>
//         {modal.open && modal.mode === "add" && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
//           >
//             <motion.form
//               initial={{ scale: 0.95, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.95, opacity: 0 }}
//               onSubmit={handleAddSave}
//               className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 w-full max-w-2xl mx-2 relative flex flex-col justify-center items-center max-h-[90vh] overflow-y-auto"
//             >
//               <button
//                 className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
//                 onClick={() => setModal({ open: false, product: null, mode: null })}
//                 aria-label="Close"
//                 type="button"
//               >
//                 ×
//               </button>
//               <h2 className="text-lg font-bold mb-4">Add Product</h2>
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full mb-4">
//                 <div>
//                   <label className="block text-sm font-semibold mb-2">Product Name<span className="text-red-500">*</span></label>
//                 <input
//                   name="name"
//                   value={editFields.name || ""}
//                   onChange={handleEditChange}
//                   className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
//                   required
//                 />
//               </div>
//                 <div>
//                   <label className="block text-sm font-semibold mb-2">Price<span className="text-red-500">*</span></label>
//                   <input
//                     name="price"
//                     type="number"
//                     min="0"
//                     value={editFields.price || ""}
//                     onChange={handleEditChange}
//                     className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-semibold mb-2">Reward Points<span className="text-red-500">*</span></label>
//                 <input
//                     name="rewardPoints"
//                   type="number"
//                   min="0"
//                     value={editFields.rewardPoints || ""}
//                   onChange={handleEditChange}
//                   className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
//                   required
//                 />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-semibold mb-2">Available</label>
//                   <input
//                     name="available"
//                     type="checkbox"
//                     checked={editFields.available}
//                     onChange={() => setEditFields(f => ({ ...f, available: !f.available }))}
//                     className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
//                   />
//                 </div>
//               </div>
//               <div className="mb-4">
//                 <label className="block text-sm font-semibold mb-2">Description<span className="text-red-500">*</span></label>
//                 <textarea
//                   name="description"
//                   value={editFields.description || ""}
//                   onChange={handleEditChange}
//                   className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
//                   rows="3"
//                   required
//                 />
//               </div>
//               <div className="mb-4">
//                 <label className="block text-sm font-semibold mb-2">Images</label>
//                 <input
//                   type="file"
//                   multiple
//                   accept="image/*"
//                   onChange={e => {
//                     const files = Array.from(e.target.files);
//                     setEditFields(f => ({
//                       ...f,
//                       images: files,
//                       imagePreviews: files.map(file => URL.createObjectURL(file))
//                     }));
//                   }}
//                   className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
//                 />
//                 <div className="flex gap-2 mt-2 flex-wrap">
//                   {editFields.imagePreviews && editFields.imagePreviews.map((src, idx) => (
//                     <img key={idx} src={src} alt="preview" className="h-16 w-16 object-cover rounded border" />
//                   ))}
//                 </div>
//               </div>
//               <div className="mb-6">
//                 <label className="block text-sm font-medium mb-1">Status</label>
//                 <select
//                   name="status"
//                   value={editFields.status || ""}
//                   onChange={handleEditChange}
//                   className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
//                   required
//                 >
//                   <option value="Active">Active</option>
//                   <option value="Inactive">Inactive</option>
//                 </select>
//               </div>
//               <div className="flex gap-2 justify-end">
//                 <button
//                   type="button"
//                   onClick={() => setModal({ open: false, product: null, mode: null })}
//                   className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 font-semibold"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 font-semibold"
//                 >
//                   Add
//                 </button>
//               </div>
//             </motion.form>
//           </motion.div>
//         )}
//       </AnimatePresence>
//       {/* Inventory History Modal */}
//       <AnimatePresence>
//         {historyModal.open && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
//           >
//             <motion.div
//               initial={{ scale: 0.95, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.95, opacity: 0 }}
//               className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 w-full max-w-md mx-2 relative"
//             >
//               <button
//                 className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
//                 onClick={() => setHistoryModal({ open: false, id: null })}
//                 aria-label="Close"
//                 type="button"
//               >
//                 ×
//               </button>
//               <h2 className="text-lg font-bold mb-4">Inventory History</h2>
//               <div className="mb-2 text-sm font-semibold">Product: {products.find(p => p.id === historyModal.id)?.name}</div>
//               <div className="overflow-y-auto max-h-60">
//                 {(inventoryHistory[historyModal.id]?.length > 0) ? (
//                   <ul className="divide-y divide-gray-200 dark:divide-slate-700">
//                     {inventoryHistory[historyModal.id].map((h, i) => (
//                       <li key={i} className="py-2 flex justify-between text-xs">
//                         <span>{new Date(h.date).toLocaleString()}</span>
//                         <span>{h.change > 0 ? '+' : ''}{h.change}</span>
//                         <span>→ {h.newValue}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 ) : (
//                   <div className="text-gray-400 text-xs">No inventory changes yet.</div>
//                 )}
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.div>
//   );
// } 
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { BASE_URL } from '../config';

//const API_BASE = "http://localhost:3000";
const ADMIN_TOKEN_KEY = "adminToken";

function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

const statusColors = {
  AVAILABLE: "bg-green-100 text-green-700",
  UNAVAILABLE: "bg-red-100 text-red-700",
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-red-100 text-red-700",
};

export default function ProductManagement() {
  // PRODUCT UI STATE
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // MODALS
  const [modal, setModal] = useState({ open: false, mode: null, product: null });
  const [editFields, setEditFields] = useState({
    name: "",
    code: "",
    count: 1,
    price: "",
    status: "AVAILABLE",
    images: [],
    imagePreviews: [],
  });

  // -- FETCH PRODUCTS (for admin; change endpoint if needed)
  async function fetchProducts() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/product/all`, {
        headers: { Authorization: `Bearer ${getAdminToken()}` },
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err.message || "Error loading products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  // -- SEARCH --
  const filtered = products.filter(
    (p) =>
      !search ||
      (p.productName || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (p.productCode + "").includes(search)
  );

  // -- EXPORT EXCEL/PDF --
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map(({ productName, productCode, productPrice, productCount, productStatus }) => ({
        productName,
        productCode,
        productPrice,
        productCount,
        productStatus,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "products.xlsx");
  };
  const handleExportPDF = async () => {
    const table = document.getElementById("product-table");
    if (!table) return;
    const canvas = await html2canvas(table);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape" });
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 10, width, height);
    pdf.save("products.pdf");
  };

  // -- HANDLERS FOR MODAL FIELDS --
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFields((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // -- OPEN MODALS
  const openAdd = () => {
    setEditFields({
      name: "",
      code: "",
      price: "",
      count: 1,
      status: "AVAILABLE",
      images: [],
      imagePreviews: [],
    });
    setModal({ open: true, mode: "add", product: null });
  };

  // -- CREATE (ADD) PRODUCT HANDLER
  async function createProduct(productData) {
    const formData = new FormData();
    
    // Add product fields
    formData.append('productName', productData.name);
    formData.append('productCount', Number(productData.count) || 1);
    formData.append('productCode', productData.code && String(productData.code).length > 0
              ? Number(productData.code)
      : Math.floor(1000 + Math.random() * 9000));
    formData.append('productPrice', Number(productData.price));
    formData.append('description', productData.description || '');
    
    // Add photo
    if (productData.images && productData.images.length > 0) {
      formData.append('photo', productData.images[0]);
    }

    const res = await fetch(`${BASE_URL}/product/add-with-photo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAdminToken()}`,
      },
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to add product");
    }
    return await res.json();
  }

  // -- ACTUAL ADD SUBMIT HANDLER
  const handleAddSave = async (e) => {
    e.preventDefault();
    try {
      if (!editFields.name || !editFields.price || !editFields.count) {
        alert("Name, price and count are required.");
        return;
      }

      // Create product with photo using the correct endpoint
      const response = await createProduct(editFields);
      
      // No need for separate image upload - it's already handled!
      setModal({ open: false, mode: null, product: null });
      fetchProducts();
      alert(response.message || "Product created successfully!");
    } catch (err) {
      alert(err.message || "Error adding product");
    }
  };

  // -- DELETE
  const handleDelete = async (id) => {
    if (window.confirm("Delete this product?")) {
      try {
        const res = await fetch(`${BASE_URL}/product/deleteProduct/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAdminToken()}`,
          },
        });
        if (!res.ok) throw new Error("Delete failed");
        fetchProducts();
      } catch (err) {
        alert(err.message || "Delete error");
      }
    }
  };

  // -- UI RENDERING
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="p-6">
      <h1 className="text-2xl font-bold mb-6">Product Management</h1>

      {/* -- Tool Bar -- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search by name or code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 w-full md:w-64"
          />
          <button
            onClick={openAdd}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:scale-105"
          >
            + Add Product
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded-lg font-semibold shadow"
          >
            Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-semibold shadow"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* -- Table -- */}
      <div className="overflow-x-auto mb-10 rounded-lg shadow">
        <table id="product-table" className="w-full bg-white">
          <thead>
            <tr className="bg-gray-100 text-slate-700 text-sm">
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Count</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Image</th>
              <th className="py-3 px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-500">
                  Loading products...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-red-500">
                  {error}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-500">
                  No products found.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-purple-50">
                  <td className="py-3 px-4">{p.productName}</td>
                  <td className="py-3 px-4">{p.productCode}</td>
                  <td className="py-3 px-4">{p.productCount}</td>
                  <td className="py-3 px-4">₹{p.productPrice}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[p.productStatus] || ""}`}
                    >
                      {p.productStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {/* Adapt image logic if your backend returns images */}
                    {Array.isArray(p.images) && p.images.length > 0 ? (
                      <img
                        src={`${BASE_URL}/product/images/${p.images[0].id}`}
                        alt="img"
                        className="h-12 w-12 object-cover rounded"
                      />
                    ) : (
                      <span style={{ color: "#aaa" }}>No image</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs"
                      onClick={() => handleDelete(p.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* -- ADD PRODUCT MODAL -- */}
      <AnimatePresence>
        {modal.open && modal.mode === "add" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          >
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={handleAddSave}
              className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl mx-2 relative flex flex-col"
            >
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
                onClick={() => setModal({ open: false, mode: null, product: null })}
                type="button"
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="text-lg font-bold mb-4">Add Product</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full mb-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Product Name<span className="text-red-500">*</span></label>
                  <input
                    name="name"
                    value={editFields.name}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Product Code</label>
                  <input
                    name="code"
                    type="number"
                    value={editFields.code}
                    onChange={handleEditChange}
                    placeholder="Auto-generated if blank"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Stock Count<span className="text-red-500">*</span></label>
                  <input
                    name="count"
                    type="number"
                    min="1"
                    value={editFields.count}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Price<span className="text-red-500">*</span></label>
                  <input
                    name="price"
                    type="number"
                    min="1"
                    value={editFields.price}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200"
                    required
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setEditFields((f) => ({
                      ...f,
                      images: files,
                      imagePreviews: files.map((file) => URL.createObjectURL(file)),
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200"
                />
                <div className="flex gap-2 mt-2 flex-wrap">
                  {editFields.imagePreviews &&
                    editFields.imagePreviews.map((src, idx) => (
                      <img
                        key={idx}
                        src={src}
                        alt="preview"
                        className="h-16 w-16 object-cover rounded border"
                      />
                    ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">Status</label>
                <select
                  name="status"
                  value={editFields.status}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="UNAVAILABLE">Unavailable</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setModal({ open: false, mode: null, product: null })}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-purple-500 text-white">
                  Add
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
