// admin/src/api.js

import { BASE_URL } from "./config";

export async function apiFetch(endpoint, options = {}) {
  const url = BASE_URL + endpoint;
  return fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
}

// Example usage in a page:
// import { apiFetch } from "../api";
// const res = await apiFetch("/admin/gifts");
// const data = await res.json(); 