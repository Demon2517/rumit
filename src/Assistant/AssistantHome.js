import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// import "../styles/assistantHome.css";

const AssistantHome = () => {
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
    <div className="assistant-home">
      <div className="header">
        <h1>Assistant Dashboard</h1>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="logout-btn"
        >
          {loading ? "Logging out..." : "Logout"}
        </button>
      </div>

      <div className="content">
        <h2>Welcome, {JSON.parse(localStorage.getItem("user") || '"Assistant"')}</h2>
        <p>Your assistant content goes here...</p>
      </div>
    </div>
  );
};

export default AssistantHome;