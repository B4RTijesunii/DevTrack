import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

function timeAgo(dateStr) {
  if (!dateStr) return "Never";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  useEffect(() => {
    api
      .me()
      .then((d) => setUser(d.user))
      .catch(() => {});
  }, []);

  async function handleSync() {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await api.sync();
      setSyncMessage(
        `Synced ${result.summary.reposFound} repos, ${result.summary.commitsAdded} commits.`,
      );
      const fresh = await api.me();
      setUser(fresh.user);
    } catch (err) {
      setSyncMessage(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }

  async function handleLogout() {
    await api.logout();
    navigate("/login");
  }

  return (
    <div className="p-6 md:p-8 max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">Settings</h1>
        <p className="text-xs text-[#8A8F99]">
          Account, sync, and preferences.
        </p>
      </div>

      <div className="bg-[#12161D] rounded-xl p-5 mb-4">
        <p className="text-[10px] text-[#565B64] uppercase tracking-wide mb-3">
          Connected Account
        </p>
        <div className="flex items-center gap-3 mb-4">
          {user?.avatarUrl && (
            <img
              src={user.avatarUrl}
              alt=""
              className="w-10 h-10 rounded-full"
            />
          )}
          <div>
            <p className="text-sm text-white font-medium">
              {user?.username ?? "Loading..."}
            </p>
            <p className="text-[11px] text-[#565B64]">via GitHub</p>
          </div>
        </div>
        <div className="flex justify-between items-center text-xs pt-3 border-t border-[#1D222A]">
          <span className="text-[#8A8F99]">Last synced</span>
          <span className="text-[#C9CDD3]">{timeAgo(user?.lastSyncedAt)}</span>
        </div>
      </div>

      <div className="bg-[#12161D] rounded-xl p-5 mb-4">
        <p className="text-[10px] text-[#565B64] uppercase tracking-wide mb-3">
          Sync
        </p>
        <p className="text-xs text-[#9095A0] mb-3">
          DevTrack auto-syncs every 4 hours. Force a fresh pull right now if you
          just pushed something.
        </p>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="text-xs bg-[#3ECF8E] text-[#05070A] font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {syncing ? "Syncing..." : "🔄 Sync now"}
        </button>
        {syncMessage && (
          <p className="text-[11px] text-[#8A8F99] mt-3">{syncMessage}</p>
        )}
      </div>

      <div className="bg-[#12161D] rounded-xl p-5 mb-4 opacity-50">
        <p className="text-[10px] text-[#565B64] uppercase tracking-wide mb-3">
          Appearance
        </p>
        <div className="flex justify-between items-center text-xs">
          <span className="text-[#8A8F99]">Light mode</span>
          <span className="text-[10px] text-[#565B64] bg-[#1D222A] px-2 py-1 rounded">
            Coming soon
          </span>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="text-xs text-red-400 hover:text-red-300 px-4 py-2"
      >
        Log out
      </button>
    </div>
  );
}
