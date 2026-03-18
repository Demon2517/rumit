import React from "react";

const InputField = ({ name, type, label, value, onChange }) => {
  return (
    <div className="input-group">
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required
      />
      <label>{label}</label>
    </div>
  );
};

export default InputField;