import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { ENDPOINTS } from "../api-endpoints";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await apiFetch(ENDPOINTS.ADMIN_LOGIN, {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      console.log('Login response:', data); // Debug log
      
      if (!res.ok || !data.token) {
        setError(data.message || "Invalid credentials");
        return;
      }
      
      localStorage.setItem("adminToken", data.token);
      console.log('Token stored:', data.token); // Debug log
      navigate("/");
    } catch (err) {
      console.error('Login error:', err); // Debug log
      setError("Server error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <form onSubmit={handleLogin} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col gap-5">
        <h1 className="text-2xl font-bold text-center mb-2">Admin Login</h1>
        {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded text-sm">{error}</div>}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            placeholder="admin"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 w-full"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-purple-500 hover:text-purple-700"
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <button
          type="submit"
          className="mt-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 transition-transform duration-200 text-base"
        >
          Login
        </button>
      </form>
    </div>
  );
} 