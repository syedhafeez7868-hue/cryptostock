import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./Dashboard.css";

/* Import modular components */
import Overview from "./Overview";
import Markets from "./Markets";
import Portfolio from "./Portfolio";
import Trade from "./Trade";
import History from "./History";
import Wallet from "./Wallet";
import Settings from "./Settings";

export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState("Overview");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navigate = useNavigate();

  // ✅ Validate JWT and extract user info
  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      navigate("/auth?mode=login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const email = decoded?.sub || decoded?.email || "";
      if (!email) throw new Error("Invalid token payload");

      setUserEmail(email);
      setUserName(email.split("@")[0]);
    } catch (err) {
      console.error("Invalid or expired token:", err);
      localStorage.removeItem("jwtToken");
      navigate("/auth?mode=login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    navigate("/"); // redirect to Landing Page
  };

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
  };

  // ✅ Content switcher
  const renderContent = () => {
    if (isSettingsOpen) {
      return <Settings userName={userName} userEmail={userEmail} onClose={handleCloseSettings} />;
    }

    switch (selectedTab) {
      case "Overview":
        return <Overview />;
      case "Markets":
        return <Markets />;
      case "Portfolio":
        return <Portfolio />;
      case "Trade":
        return <Trade />;
      case "Wallet":
        return <Wallet />;
      case "History":
        return <History />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">SafeCryptoStocks</h2>
        <ul className="sidebar-menu">
          {["Overview", "Markets", "Portfolio", "Trade", "Wallet", "History"].map((item) => (
            <li
              key={item}
              className={selectedTab === item ? "active" : ""}
              onClick={() => {
                setSelectedTab(item);
                setIsSettingsOpen(false);
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Section */}
      <main className="main-section">
        <header className="top-navbar">
          <div className="search-box">
            <input type="text" placeholder="Search by symbol..." />
            <button>🔍</button>
          </div>

          <div className="top-buttons">
            <button className="settings-btn" onClick={handleSettingsClick}>
              ⚙ Settings
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              🔒 Logout
            </button>

            <div className="user-info">
              <img
                src="https://www.w3schools.com/howto/img_avatar.png"
                alt="user-avatar"
                className="user-avatar"
              />
              <div>
                <h4>{userName || "User"}</h4>
                <p>{userEmail}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="content-display">{renderContent()}</div>
      </main>
    </div>
  );
}
