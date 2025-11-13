import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./Dashboard.css";

import Watchlist from "./Watchlist";
import Home from "./Home";
import Overview from "./Overview";
import Markets from "./Markets";
import Portfolio from "./Portfolio";
import History from "./History";
import Wallet from "./Wallet";
import Settings from "./Settings";
import More from "./More";


export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState("Home");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
 

  // ✅ Theme persistence
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) setTheme(savedTheme);
    document.body.setAttribute("data-theme", savedTheme || "dark");
  }, []);

  // ✅ JWT decoding for user info
  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      navigate("/auth?mode=login");
      return;
    }
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser || !storedUser.email) {
      localStorage.removeItem("jwtToken");
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
  localStorage.removeItem("user");
  localStorage.removeItem("userDetails");
  sessionStorage.clear();

  // Force reload to clear React state
  window.location.href = "/auth?mode=login";
  };


  // ✅ Theme toggle
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.body.setAttribute("data-theme", newTheme);
  };

  // ✅ Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // ✅ Page rendering logic
  const renderContent = () => {
    if (isSettingsOpen)
      return (
        <Settings
          userName={userName}
          userEmail={userEmail}
          onClose={() => setIsSettingsOpen(false)}
        />
      );

    switch (selectedTab) {
      case "Home":
        return <Home/>;
      case "Overview":
        return <Overview />;
      case "Markets":
        return <Markets />;
      case "Portfolio":
        return <Portfolio />;
      case "Wallet":
        return <Wallet />;
      case "History":
        return <History />;
      case "More":
        return <More />;
      case "Watchlist":
        return <Watchlist />;
      default:
        return <Home/>;
    }
  };

  return (
    <div className={`dashboard-container ${theme}`}>
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
        <div className="sidebar-header">
          <h2 className={`logo ${sidebarOpen ? "expanded" : "collapsed-logo"}`}>
            {sidebarOpen ? "SafeCryptoStocks" : "SCS"}
          </h2>
          <button
            className="toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Collapse" : "Expand"}
          >
            ☰
          </button>
        </div>

        <ul className="sidebar-menu">
         {["Home", "Overview", "Markets", "Portfolio", "Wallet", "History", "More"].map((item) => (

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

      

      {/* Main section */}
      <main className="main-section">
        <header className="top-navbar">
          {/* Search */}
          <div className="search-box">
            <input type="text" placeholder="Search by symbol..." />
            <button>🔍</button>
          </div>

          {/* Watchlist + Notifications + Profile */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="icon-btn"
              title="Watchlist"
              onClick={() => setSelectedTab("Watchlist")}
            >
              ⭐
            </button>

            <button className="icon-btn" title="Notifications">
              🔔
            </button>

            {/* Profile dropdown */}
            <div className="user-profile" ref={dropdownRef}>
              <div
                className="user-info"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
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

              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <button onClick={toggleTheme}>
                    {theme === "dark" ? "☀ Light Theme" : "🌙 Dark Theme"}
                  </button>
                  <button onClick={() => setIsSettingsOpen(true)}>⚙ Settings</button>
                  <button onClick={handleLogout}>🔒 Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="content-display">{renderContent()}</div>
      </main>
    </div>
  );
}
