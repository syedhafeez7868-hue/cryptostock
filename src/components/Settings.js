import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import "./Setting.css";

export default function Settings({ onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
  });

  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  // ✅ Load saved data
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("userDetails"));
    if (savedUser) setFormData(savedUser);

    const savedCurrency = localStorage.getItem("currency") || "USD";
    setSelectedCurrency(savedCurrency);
  }, []);

  // ✅ Handle field change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Save both profile + currency
  const handleSave = () => {
    localStorage.setItem("userDetails", JSON.stringify(formData));
    localStorage.setItem("currency", selectedCurrency);
    alert(`✅ Settings saved! Currency set to ${selectedCurrency}.`);
  };

  return (
    <div className="settings-container-center">
      <h2>⚙ Settings</h2>
      <p>Manage and edit your personal, banking and display preferences.</p>

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
            name="mobile"
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
      </div>

      {/* ✅ Currency Selector */}
      <div className="general-section">
        <h3>Currency Preference</h3>
        <p>Select your preferred currency to display dashboard values.</p>
        <select
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
          className="currency-select"
        >
          <option value="USD">🇺🇸 US Dollar (USD)</option>
          <option value="INR">🇮🇳 Indian Rupee (INR)</option>
          <option value="AED">🇦🇪 UAE Dirham (AED)</option>
          <option value="CNY">🇨🇳 Chinese Yuan (CNY)</option>
          <option value="EUR">🇪🇺 Euro (EUR)</option>
          <option value="GBP">🇬🇧 British Pound (GBP)</option>
        </select>
      </div>

      <button onClick={handleSave}>💾 Save Changes</button>
      <button className="close-settings-btn" onClick={onClose}>
        ← Back to Dashboard
      </button>
    </div>
  );
}
