export const statusStyle: Record<string, { badge: string; bar: string; dot: string; label: string }> = {
  weak: { badge: "bg-red-50 text-red-700 ring-red-200", bar: "bg-red-500", dot: "bg-red-500", label: "Weak" },
  medium: { badge: "bg-amber-50 text-amber-700 ring-amber-200", bar: "bg-amber-500", dot: "bg-amber-500", label: "Medium" },
  strong: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", bar: "bg-emerald-500", dot: "bg-emerald-500", label: "Strong" },
  untested: { badge: "bg-slate-100 text-slate-600 ring-slate-200", bar: "bg-slate-300", dot: "bg-slate-300", label: "Untested" },
};
