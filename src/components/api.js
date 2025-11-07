import axios from "axios";

// 🌍 Public CoinGecko API (Top 20 coins)
export const COINGECKO_MARKETS_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=24h";

// 🔗 Backend API base URL (your Spring Boot app)
export const backend = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});
