export function getUserEmail() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.email) return user.email;

    // fallback: decode from jwt if needed
    const token = localStorage.getItem("jwtToken");
    if (token) {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      return decoded.sub || decoded.email || "";
    }
  } catch (e) {
    console.error("Error reading user email:", e);
  }
  return "";
}
