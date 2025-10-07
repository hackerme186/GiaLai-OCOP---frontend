// 📁 src/lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000", // 👈 thay bằng URL BE của bạn
});

export default api;
