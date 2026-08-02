import { useEffect, useState } from "react";
import { api } from "../lib/api";

function WeeklyTrendChart({ data }) {
  const max = Math.max(...data.map((d) => d.commits), 1);
  return (
    <div className="bg-[#12161D] rounded-xl p-5">
      <p className="text-sm font-semibold text-white mb-4">
        Commits — Last 8 Weeks
      </p>
      <div className="flex items-end gap-2 h-36">
        {data.map((week) => (
          <div
            key={week.weekStart}
            className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
          >
            <span className="text-[10px] text-[#565B64]">{week.commits}</span>
            <div
              className="w-full bg-[#3ECF8E] rounded-t"
              style={{
                height: `${(week.commits / max) * 100}%`,
                minHeight: week.commits > 0 ? "4px" : "0",
              }}
            />
            <span className="text-[9px] text-[#565B64]">
              {new Date(week.weekStart).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthlyTrendChart({ data }) {
  const max = Math.max(...data.map((d) => d.commits), 1);
  return (
    <div className="bg-[#12161D] rounded-xl p-5">
      <p className="text-sm font-semibold text-white mb-4">
        Commits & Active Days — Last 6 Months
      </p>
      <div className="flex flex-col gap-3">
        {data.map((month) => (
          <div key={month.month} className="flex items-center gap-3">
            <span className="text-[11px] text-[#8A8F99] w-14 shrink-0">
              {new Date(month.month + "-01").toLocaleDateString("en-US", {
                month: "short",
                year: "2-digit",
              })}
            </span>
            <div className="flex-1 bg-[#1D222A] rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-[#3ECF8E] rounded-full"
                style={{ width: `${(month.commits / max) * 100}%` }}
              />
            </div>
            <span className="text-[11px] text-white w-10 text-right shrink-0">
              {month.commits}
            </span>
            <span className="text-[10px] text-[#565B64] w-14 text-right shrink-0">
              {month.activeDays}d active
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopRepos({ repos }) {
  const max = Math.max(...repos.map((r) => r.commits), 1);
  return (
    <div className="bg-[#12161D] rounded-xl p-5">
      <p className="text-sm font-semibold text-white mb-4">
        Top Repos — Last 90 Days
      </p>
      {repos.length === 0 && (
        <p className="text-xs text-[#565B64]">No commits in this window.</p>
      )}
      <div className="flex flex-col gap-3">
        {repos.map((repo, i) => (
          <div key={repo.name} className="flex items-center gap-3">
            <span className="text-[11px] text-[#565B64] w-4">{i + 1}</span>
            <span className="text-xs text-[#C9CDD3] flex-1 truncate">
              {repo.name}
            </span>
            <div className="w-24 bg-[#1D222A] rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-[#3ECF8E] rounded-full"
                style={{ width: `${(repo.commits / max) * 100}%` }}
              />
            </div>
            <span className="text-[11px] text-white w-8 text-right">
              {repo.commits}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .analytics()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="p-8 text-red-400 text-sm">{error}</div>;
  if (!data)
    return <div className="p-8 text-[#8A8F99] text-sm">Loading...</div>;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">Analytics</h1>
        <p className="text-xs text-[#8A8F99]">
          The bigger picture, beyond this week.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <WeeklyTrendChart data={data.weeklyTrend} />
        <div className="grid md:grid-cols-2 gap-4">
          <MonthlyTrendChart data={data.monthlyTrend} />
          <TopRepos repos={data.topRepos} />
        </div>
      </div>
    </div>
  );
}
