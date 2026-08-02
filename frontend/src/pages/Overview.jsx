import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../lib/api";

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function StatCard({ label, value, delta, icon }) {
  return (
    <div className="bg-[#12161D] rounded-xl p-4">
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-[11px] text-[#8A8F99]">{label}</span>
        <span>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      {delta !== undefined && (
        <p
          className={`text-[11px] ${delta >= 0 ? "text-[#3ECF8E]" : "text-[#8A8F99]"}`}
        >
          {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}% vs last week
        </p>
      )}
    </div>
  );
}

export default function Overview() {
  const { overview: data, loading, refreshOverview } = useOutletContext();
  const [review, setReview] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    api.monthlyReview
      .latest()
      .then((r) => setReview(r.summary))
      .catch(() => {});
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      await api.sync();
      await refreshOverview();
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-[#8A8F99] text-sm">Loading...</div>;
  }
  if (!data) {
    return (
      <div className="p-8 text-red-400 text-sm">Failed to load overview.</div>
    );
  }

  const maxCommits = Math.max(...data.commitsPerDay, 1);

  return (
    <div className="p-6 md:p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Overview</h1>
          <p className="text-xs text-[#8A8F99]">
            Track your progress, honestly.
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="text-xs bg-[#151A21] text-[#C9CDD3] px-3 py-2 rounded-lg disabled:opacity-50"
        >
          {syncing ? "Syncing..." : "🔄 Sync now"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard
          label="Total Commits"
          value={data.totalCommits.value}
          delta={data.totalCommits.deltaPct}
          icon="🟣"
        />
        <StatCard
          label="Active Days"
          value={`${data.activeDays.value}/7`}
          delta={data.activeDays.deltaPct}
          icon="🟠"
        />
        <StatCard
          label="Projects Worked On"
          value={data.projectsWorkedOn.value}
          delta={data.projectsWorkedOn.deltaPct}
          icon="🔵"
        />
        <StatCard
          label="PRs & Issues Closed"
          value={data.milestones.prsMerged + data.milestones.issuesClosed}
          icon="🟢"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-[#12161D] rounded-xl p-5">
          <p className="text-sm font-semibold text-white mb-4">
            Commits This Week
          </p>
          <div className="flex items-end gap-2.5 h-28">
            {data.commitsPerDay.map((count, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
              >
                <div
                  className="w-full bg-[#3ECF8E] rounded-t"
                  style={{
                    height: `${(count / maxCommits) * 100}%`,
                    minHeight: count > 0 ? "4px" : "0",
                  }}
                />
                <span className="text-[10px] text-[#565B64]">
                  {dayLabels[i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#12161D] rounded-xl p-5">
          <p className="text-sm font-semibold text-white mb-4">
            Projects Breakdown
          </p>
          <div className="flex flex-col gap-2.5">
            {data.projectBreakdown.length === 0 && (
              <p className="text-xs text-[#565B64]">
                No commits yet this week.
              </p>
            )}
            {data.projectBreakdown.map((p) => (
              <div
                key={p.name}
                className="flex justify-between text-xs text-[#C9CDD3]"
              >
                <span>{p.name}</span>
                <span className="text-[#565B64]">
                  {p.count} ({p.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border border-[#1E4B3A] rounded-xl p-5">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-semibold text-white">Monthly Review</p>
          <span>✨</span>
        </div>
        <p className="text-xs text-[#9095A0] leading-relaxed">
          {review?.aiSummary ?? "No review generated yet this month."}
        </p>
      </div>
    </div>
  );
}
