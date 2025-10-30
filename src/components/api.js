// src/services/api.js
import axios from "axios";

/* ---------------------------------------------
   ✅ 1. COINGECKO PUBLIC API INSTANCE
   --------------------------------------------- */
export const coingecko = axios.create({
  baseURL: "https://api.coingecko.com/api/v3",
  timeout: 15000,
});

/* 
   EXAMPLE USAGE:
   const res = await coingecko.get("/coins/markets", {
     params: {
       vs_currency: "usd",
       order: "market_cap_desc",
       per_page: 20,
       page: 1,
       sparkline: true,
       price_change_percentage: "24h"
     }
   });
*/

/* ---------------------------------------------
   ✅ 2. SPRING BOOT BACKEND API INSTANCE
   (with JWT Authorization Header)
   --------------------------------------------- */
export const backend = axios.create({
  baseURL: "http://localhost:8080", // Your backend root URL
  timeout: 15000,
});

// Automatically attach JWT from localStorage
backend.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwtToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ---------------------------------------------
   ✅ 3. REUSABLE COINGECKO MARKET URL
   (Used in Overview.js, Markets.js, etc.)
   --------------------------------------------- */
export const COINGECKO_MARKETS_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=24h";

/* ---------------------------------------------
   ✅ 4. OPTIONAL HELPER FUNCTIONS (ready to use)
   --------------------------------------------- */
export async function getTopMarketCoins() {
  try {
    const res = await axios.get(COINGECKO_MARKETS_URL);
    return res.data;
  } catch (error) {
    console.error("Error fetching market data:", error);
    return [];
  }
}

export async function getCoinPrice(id) {
  try {
    const res = await coingecko.get(`/simple/price`, {
      params: { ids: id, vs_currencies: "usd" },
    });
    return res.data[id]?.usd || 0;
  } catch (error) {
    console.error("Error fetching price for", id, error);
    return 0;
  }
}

export async function searchCoin(query) {
  try {
    const res = await coingecko.get(`/search`, { params: { query } });
    return res.data.coins || [];
  } catch (error) {
    console.error("Coin search failed:", error);
    return [];
  }
}
