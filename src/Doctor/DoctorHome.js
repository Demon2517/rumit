import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// import "../styles/assistantHome.css";

const DoctorHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    // Ask for confirmation
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (!confirmed) return;

    setLoading(true);

    // Clear all local storage
    localStorage.removeItem("islogin");
    localStorage.removeItem("user");
    localStorage.removeItem("logintype");
    localStorage.removeItem("rememberEmail");
    sessionStorage.clear();

    // Redirect to login
    navigate("/", { replace: true });
  };

  return (
    <div className="doctor-home">
      <div className="header">
        <h1>Doctor Dashboard</h1>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="logout-btn"
        >
          {loading ? "Logging out..." : "Logout"}
        </button>
      </div>

      <div className="content">
        <h2>Welcome, {JSON.parse(localStorage.getItem("user") || '"Doctor"')}</h2>
        <p>Your Doctor content goes here...</p>
      </div>
    </div>
  );
};

export default DoctorHome;