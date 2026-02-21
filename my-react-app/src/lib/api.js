// src/lib/api.js
const API_BASE_URL = "http://127.0.0.1:8000/api";

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password}),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Invalid credentials");
  }

  const data = await response.json();

  // Save tokens to localStorage
  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);
  localStorage.setItem("user", JSON.stringify(data.user));

  return data.user;
}

export async function getProtectedData() {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API_BASE_URL}/protected/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error("Unauthorized or token expired");
  return response.json();
}
