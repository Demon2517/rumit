import React from "react";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, role }) {
  const isLogin = localStorage.getItem("islogin") === "true";
  const loginType = localStorage.getItem("logintype"); // INSTRUCTOR / STUDENT

  // not logged in
  if (!isLogin) {
    return <Navigate to="/"  />;
  }

  // role mismatch
  if (role && role !== loginType) {
    // wrong role → send to respective home
    return loginType === "Admin"
      ? <Navigate to="/AdminHome" replace />
      : loginType === "Assistant" ?<Navigate to="/AssistantHome" replace /> 
      : <Navigate to="/DoctoreHome" replace />;
  }

  return children;
}