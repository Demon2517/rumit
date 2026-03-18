import React from "react";

const Button = ({ title, children }) => {
  return <button className="login-btn">{title}{children}</button>;
};

export default Button;