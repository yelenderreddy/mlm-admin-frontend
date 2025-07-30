import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function RequireAdminAuth({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token && location.pathname !== "/login") {
      navigate("/login");
    }
  }, [location, navigate]);
  return children;
} 