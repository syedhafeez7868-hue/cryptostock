import React from "react";
import "./Dashboard.css";

export default function Home() {
  return (
    <div style={{ padding: "40px", color: "#fff", backgroundColor: "#0f181b" }}>
      {/* Section 1: Hero */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ maxWidth: "500px" }}>
         
          <div style={{ backgroundColor: "#f8c400", display: "inline-block", padding: "4px 12px", borderRadius: "12px", color: "#0b0e11", fontWeight: "600" }}>
            <h1>🇮🇳</h1> <span>🇮🇳</span> {/* India flag emoji */}Made for INDIA
          </div>
          <h1 style={{ fontSize: "2.5rem", color: "#f8c400", marginTop: "20px" }}>
            Trade Futures & Options <br /> on Bitcoin and Ether
          </h1>
          <p style={{ color: "#cbd5e1", marginTop: "10px" }}>
            Elevate your crypto F&O trading with 24/7 open markets, efficient
            margining and INR settlement.
          </p>
          <button style={{ backgroundColor: "#f8c400", color: "#0b0e11", padding: "10px 20px", border: "none", borderRadius: "8px", fontWeight: "600", marginTop: "20px" }}>
            Trade
          </button>
        </div>
        <img
          src="https://via.placeholder.com/360x480?text=App+Preview"
          alt="app preview"
          style={{ borderRadius: "12px", marginTop: "20px" }}
        />
      </div>

      {/* Section 2: Features */}
      <div style={{ marginTop: "60px" }}>
        <h2 style={{ color: "#f8c400" }}>Like F&O Trading, But Better</h2>
        <p style={{ color: "#cbd5e1" }}>
          Familiar instruments (Futures & Options), familiar interface — but with crypto underlyings.
        </p>

        <ul style={{ marginTop: "20px", lineHeight: "2" }}>
          <li>✅ Start Smaller — trade BTC from ₹5000 and ETH from ₹2500</li>
          <li>✅ Enjoy daily expiries for more trading opportunities</li>
          <li>✅ Trade 24×7 — crypto markets never close</li>
          <li>✅ Do more with less — smart margining and leverage</li>
        </ul>
      </div>

      {/* Section 3: Support */}
      <div style={{ marginTop: "60px" }}>
        <h2 style={{ color: "#f8c400" }}>24×7 Customer Support</h2>
        <p style={{ color: "#cbd5e1" }}>
          Need help? We’re available around the clock. Contact us via support chat, Telegram, or email.
        </p>
      </div>

      {/* Section 4: App download */}
      <div style={{ marginTop: "60px", display: "flex", alignItems: "center", gap: "20px" }}>
        <div>
          <h3 style={{ color: "#f8c400" }}>Download App, Trade On The Go!</h3>
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button style={{ background: "#f8c400", border: "none", padding: "8px 14px", borderRadius: "8px", color: "#0b0e11" }}>
              📱 Google Play
            </button>
            <button style={{ background: "#f8c400", border: "none", padding: "8px 14px", borderRadius: "8px", color: "#0b0e11" }}>
               App Store
            </button>
          </div>
        </div>
        <img src="https://via.placeholder.com/200x200?text=QR+Code" alt="QR Code" />
      </div>
    </div>
  );
}
