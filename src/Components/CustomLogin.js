import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../UI/Card";
import InputField from "../UI/InputField";
import Button from "../UI/Button";
import Toast from "../UI/Toast";
import "../styles/login.css";

const CustomLogin = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type) => {
    setToast({message, type, show: true });
  };
  //   const [showToast, setShowToast] = useState(false);
  //   const [toastMsg, setToastMsg] = useState("");
  //   const [toastType, setToastType] = useState("danger");

  // Auto-hide toast
//   useEffect(() => {
//     if (showToast) {
//       const timer = setTimeout(() => showToast(false), 3000);
//       return () => clearTimeout(timer);
//     }
//   }, [showToast]);

  // Auto-login if token exists
  useEffect(() => {
    const token = localStorage.getItem("islogin");
    if (token) {
      const loginType = localStorage.getItem("logintype");
      const route =
        loginType === "Admin"
          ? "/AdminHome"
          : loginType === "Assistant"
            ? "/AssistantHome"
            : "/DoctorHome";
      navigate(route);
    }
  }, [navigate]);

  // Load remembered email
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }
  }, []);

  const showError = (msg) => {
    showToast(msg, "danger");
  };


  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate inputs
    if (!email.trim()) {
      showToast("Invalid Credentials", "danger");
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      showToast("Invalid Credentials", "danger");
      setLoading(false);
      return;
    }

    try {
      // Construct API URL - make sure this matches your backend
      const path =`${process.env.REACT_APP_API_URL}/${process.env.REACT_APP_ADMIN_LOGIN}`;  
      console.log("🔄 Attempting login with:", { email, password: "***" });

      const response = await fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("📡 Response Status:", response.status);
      console.log("📡 Response Headers:", response.headers);

      // Parse response
      const result = await response.json();
      console.log("📄 Response Data:", result);

      // Check if login was successful
      if (result?.status === true) {
        const userData = result.data?.Data || result.data;
        const userRole = userData?.Role || userData?.role || "Doctor";
        const userName = userData?.Name || userData?.name || "User";

        // Store user data
        localStorage.setItem("user", JSON.stringify(userName));
        localStorage.setItem("islogin", "true");
        localStorage.setItem("logintype", userRole);

        // Handle Remember Me
        if (remember) {
          localStorage.setItem("rememberEmail", email);
        } else {
          localStorage.removeItem("rememberEmail");
        }

        showToast("Login Successful", "success");

        // Navigate after delay
        setTimeout(() => {
          const route =
            userRole === "Admin"
              ? "/AdminHome"
              : userRole === "Assistant"
                ? "/AssistantHome"
                : "/DoctorHome";
          navigate(route);
        }, 1000);
      } else {
        // Handle error responses
        const errorMsg = result.message || result.error || "Login failed";
        showError(errorMsg);
        console.error("❌ Login Error:", result);
      }
    } catch (error) {
      console.error("❌ Network Error:", error);
      showError(
        error instanceof Error
          ? error.message
          : "Server error. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="circle one"></div>
      <div className="circle two"></div>

      <Card>
        <h2 className="title">OM Dental Clinic</h2>
        <p className="subtitle">Smile Brighter Every Day 😊</p>

        <form onSubmit={handleLogin}>
          <InputField
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            disabled={loading}
          />

          <InputField
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            disabled={loading}
          />

          <div className="remember-me">
            <input
              type="checkbox"
              id="remember-checkbox"
              checked={remember}
              onChange={() => setRemember(!remember)}
              disabled={loading}
            />
            <label htmlFor="remember-checkbox">Remember Me</label>
          </div>

          <Button
            title={loading ? "Logging in..." : "Login"}
            disabled={loading}
          />

          <p className="extra">
            Forgot password? <span>Click here</span>
          </p>
        </form>
        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      </Card>
    </div>
  );
};

export default CustomLogin;
