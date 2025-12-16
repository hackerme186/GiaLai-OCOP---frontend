"use client";

// Shared status helpers to keep icons/colors consistent across roles/pages

type StatusTone =
  | "success"
  | "pending"
  | "processing"
  | "shipping"
  | "failed"
  | "default";

const normalize = (status?: string) => (status || "").toLowerCase();

export const mapStatusToBase = (status?: string): string => {
  const s = normalize(status);
  if (s.includes("pendingcompletion")) return "Completed";
  if (s.includes("cancel") || s.includes("fail") || s.includes("reject"))
    return "Cancelled";
  if (s.includes("ship") || s.includes("giao") || s.includes("deliver"))
    return "Shipped";
  if (s.includes("process")) return "Processing";
  if (s.includes("pending")) return "Pending";
  if (s.includes("success") || s.includes("complete") || s.includes("paid"))
    return "Completed";
  return "Pending";
};

export const statusTone = (status?: string): StatusTone => {
  const s = normalize(status);
  if (!s) return "default";
  if (s.includes("pendingcompletion")) return "success";
  if (s.includes("cancel") || s.includes("fail") || s.includes("reject"))
    return "failed";
  if (s.includes("ship") || s.includes("giao") || s.includes("deliver"))
    return "shipping";
  if (s.includes("process")) return "processing";
  if (s.includes("pending")) return "pending";
  if (s.includes("success") || s.includes("complete") || s.includes("paid"))
    return "success";
  return "default";
};

export const statusIcon = (status?: string) => {
  switch (statusTone(status)) {
    case "success":
      return "✅";
    case "pending":
      return "🕒";
    case "processing":
      return "⚙️";
    case "shipping":
      return "🚚";
    case "failed":
      return "❌";
    default:
      return "ℹ️";
  }
};

export const statusBadgeClass = (status?: string) => {
  switch (statusTone(status)) {
    case "success":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "processing":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "shipping":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "failed":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

export const statusStepIndex = (status?: string) => {
  const tone = statusTone(status);
  if (tone === "failed") return -1;
  if (tone === "pending") return 0;
  if (tone === "processing") return 1;
  if (tone === "shipping") return 2;
  if (tone === "success") return 3;
  return 0;
};
