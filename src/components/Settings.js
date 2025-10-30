import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import "./Setting.css";


export default function Settings({ onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",      // ✅ matches what we save in localStorage
    address: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
  });

  // ✅ Load from localStorage when page opens
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("userDetails"));
    if (savedUser) {
      setFormData(savedUser);
    }
  }, []);

  // ✅ Update any input field dynamically
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Save back to localStorage
  const handleSave = () => {
    localStorage.setItem("userDetails", JSON.stringify(formData));
    alert("✅ Your details have been updated successfully!");
  };

  return (
    <div className="settings-container-center">
      <h2>⚙ Settings</h2>
      <p>Manage and edit your personal and bank details.</p>

      <div className="general-section">
        <h3>Personal Information</h3>

        <label>
          Name:
          <input
            type="text"
            name="name"
            value={formData.name}
            placeholder="Enter your full name"
            onChange={handleChange}
          />
        </label>

        <label>
          Email:
          <input
            type="email"
            name="email"
            value={formData.email}
            placeholder="Enter your email address"
            onChange={handleChange}
          />
        </label>

        <label>
          Mobile Number:
          <input
            type="tel"
            name="mobile"  // ✅ must match localStorage key
            value={formData.mobile}
            placeholder="Enter your mobile number"
            onChange={handleChange}
          />
        </label>

        <label>
          Address:
          <textarea
            name="address"
            value={formData.address}
            placeholder="Enter your residential address"
            onChange={handleChange}
            rows="3"
          />
        </label>
      </div>

      <div className="general-section">
        <h3>Bank Account Details</h3>

        <label>
          Bank Name:
          <input
            type="text"
            name="bankName"
            value={formData.bankName}
            placeholder="Enter bank name"
            onChange={handleChange}
          />
        </label>

        <label>
          Account Number:
          <input
            type="text"
            name="accountNumber"
            value={formData.accountNumber}
            placeholder="Enter account number"
            onChange={handleChange}
          />
        </label>

        <label>
          IFSC Code:
          <input
            type="text"
            name="ifscCode"
            value={formData.ifscCode}
            placeholder="Enter IFSC code"
            onChange={handleChange}
          />
        </label>

        <button onClick={handleSave}>💾 Save Changes</button>
      </div>

      <button className="close-settings-btn" onClick={onClose}>
        ← Back to Dashboard
      </button>
    </div>
  );
}
