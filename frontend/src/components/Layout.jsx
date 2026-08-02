import { Outlet } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

export default function Layout() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOverview = useCallback(async () => {
    try {
      const data = await api.overview();
      setOverview(data);
    } catch (err) {
      console.error("Failed to load overview:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  return (
    <div className="min-h-screen bg-[#05070A] flex">
      <Sidebar user={user} streak={overview?.streak} />
      <div className="flex-1 min-w-0 pb-16 md:pb-0">
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[#1D222A]">
          <div className="flex items-center gap-2">
            <span className="text-[#3ECF8E]">{"</>"}</span>
            <span className="text-white font-bold text-sm">DevTrack</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#C9CDD3]">
            🔥 {overview?.streak?.current ?? 0} days
          </div>
        </div>
        <Outlet
          context={{ overview, loading, refreshOverview: loadOverview }}
        />
      </div>
      <BottomNav />
    </div>
  );
}
