import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Auth.css";

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [page, setPage] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Detect mode from URL (login/signup)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    setPage(mode === "signup" ? "signup" : "login");
  }, [location.search]);

  // ✅ LOGIN HANDLER
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return alert("Please enter email and password.");

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:8080/api/auth/login", {
        email,
        password,
      });

     if (res.data.token) {
  // ✅ Save token
  localStorage.setItem("jwtToken", res.data.token);

  // ✅ Decode and save user email (for cross-check)
  const tokenParts = res.data.token.split(".");
  if (tokenParts.length === 3) {
    const decoded = JSON.parse(atob(tokenParts[1]));
    const emailFromToken = decoded.sub || decoded.email || email;
    localStorage.setItem("user", JSON.stringify({ email: emailFromToken }));
  }

  alert("✅ Login Successful!");
  navigate("/dashboard");
}
 else {
        alert(res.data.message || "Invalid credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.response?.status === 401) alert("Invalid credentials!");
      else alert("Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ SIGNUP HANDLER
const handleSignup = async (e) => {
  e.preventDefault();

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  try {
    setLoading(true);
    const res = await axios.post("http://localhost:8080/api/auth/register", {
      name,
      email,
      password,
      phoneNumber,
      address,
    });

    if (res.data.token || res.status === 200) {
      // ✅ 1. Save user details in localStorage for Settings page
      const userDetails = {
        name,
        email,
        mobile: phoneNumber,
        address,
        bankName: "",
        accountNumber: "",
        ifscCode: "",
      };
      localStorage.setItem("userDetails", JSON.stringify(userDetails));

      // ✅ 2. Optional: Save JWT token if returned
      if (res.data.token) {
        localStorage.setItem("jwtToken", res.data.token);
      }

      alert("🎉 Signup successful! You can now login.");
      setPage("login");
    } else {
      alert(res.data.message || "Signup failed.");
    }
  } catch (err) {
    console.error("Signup error:", err);
    if (err.response?.status === 409)
      alert("⚠️ Email already exists. Try logging in.");
    else alert("Error during signup. Try again.");
  } finally {
    setLoading(false);
  }
};


  // ✅ FORGOT PASSWORD → SEND OTP
  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!email) {
      alert("Please enter your email!");
      return;
    }
    const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(randomOtp);
    alert(`🔐 OTP sent to your email: ${randomOtp}`);
    setPage("otp");
  };

  // ✅ VERIFY OTP
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp === generatedOtp) {
      alert("✅ OTP verified!");
      setPage("reset");
    } else {
      alert("❌ Invalid OTP! Try again.");
    }
  };

  // ✅ RESET PASSWORD
  const handleResetPassword = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return alert("Passwords do not match!");
    alert("🎉 Password reset successful! Please login now.");
    setPage("login");
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-header">SafeCryptoStocks</h1>

        {/* LOGIN PAGE */}
        {page === "login" && (
          <>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁️"}
                </span>
              </div>
              <button type="submit" disabled={loading}>
                {loading ? "Please wait..." : "Login"}
              </button>
            </form>
            <div className="auth-links">
              <span onClick={() => setPage("forgot")}>Forgot Password?</span>
              <span onClick={() => setPage("signup")}>Sign Up</span>
            </div>
          </>
        )}

        {/* SIGNUP PAGE */}
        {page === "signup" && (
          <>
            <h2>Create Account</h2>
            <form onSubmit={handleSignup}>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁️"}
                </span>
              </div>
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? "Please wait..." : "Sign Up"}
              </button>
            </form>
            <div className="auth-links">
              <span onClick={() => setPage("login")}>Back to Login</span>
            </div>
          </>
        )}
        

        {/* FORGOT PASSWORD */}
        {page === "forgot" && (
          <>
            <h2>Forgot Password</h2>
            <form onSubmit={handleSendOtp}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit">Send OTP</button>
            </form>
            <div className="auth-links">
              <span onClick={() => setPage("login")}>Back to Login</span>
            </div>
          </>
        )}

        {/* OTP PAGE */}
        {page === "otp" && (
          <>
            <h2>Enter OTP</h2>
            <form onSubmit={handleVerifyOtp}>
              <input
                type="text"
                placeholder="Enter 4-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              <button type="submit">Verify OTP</button>
            </form>
          </>
        )}

        {/* RESET PASSWORD */}
        {page === "reset" && (
          <>
            <h2>Reset Password</h2>
            <form onSubmit={handleResetPassword}>
              <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button type="submit">Reset Password</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;
