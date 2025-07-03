import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin mx-auto" />
        <p className="text-slate-600 dark:text-slate-400 text-sm animate-pulse">Loading...</p>
      </div>
    </div>
  );
}