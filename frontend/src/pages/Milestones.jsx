import { useEffect, useState } from "react";
import { api } from "../lib/api";

function MilestoneRow({ milestone }) {
  const isPR = milestone.type === "pr";
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#1D222A] last:border-b-0">
      <span
        className={`text-base ${isPR ? "text-[#3ECF8E]" : "text-[#4FA3F7]"}`}
      >
        {isPR ? "🔀" : "✅"}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#F2F1ED] truncate">{milestone.title}</p>
        <p className="text-[10px] text-[#565B64] mt-0.5">
          {isPR ? "Merged" : "Closed"} in {milestone.repoName}
        </p>
      </div>
      <span className="text-[10px] text-[#565B64] shrink-0">
        {new Date(milestone.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </span>
    </div>
  );
}

export default function Milestones() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedRepo, setSelectedRepo] = useState("");

  function load(repo) {
    api
      .milestones(repo || null)
      .then(setData)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  function handleRepoChange(e) {
    const repo = e.target.value;
    setSelectedRepo(repo);
    load(repo);
  }

  if (error) return <div className="p-8 text-red-400 text-sm">{error}</div>;
  if (!data)
    return <div className="p-8 text-[#8A8F99] text-sm">Loading...</div>;

  return (
    <div className="p-6 md:p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Milestones</h1>
          <p className="text-xs text-[#8A8F99]">
            PRs merged and issues closed — what actually shipped.
          </p>
        </div>
        <select
          value={selectedRepo}
          onChange={handleRepoChange}
          className="text-xs bg-[#151A21] text-[#C9CDD3] px-3 py-2 rounded-lg border-none outline-none"
        >
          <option value="">All repos</option>
          {data.repoNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-[#12161D] rounded-xl p-5">
        {data.milestones.length === 0 && (
          <p className="text-xs text-[#565B64]">
            No merged PRs or closed issues yet.
          </p>
        )}
        {data.milestones.map((m) => (
          <MilestoneRow key={m.id} milestone={m} />
        ))}
      </div>
    </div>
  );
}
