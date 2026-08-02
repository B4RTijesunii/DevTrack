import { useEffect, useState } from "react";
import { api } from "../lib/api";

const TYPE_LABELS = {
  commits: "Commits",
  active_days: "Active Days",
  prs_merged: "PRs Merged",
  issues_closed: "Issues Closed",
};

function GoalCard({ goal, onDelete }) {
  return (
    <div className="bg-[#12161D] rounded-xl p-5 mb-3">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-sm font-semibold text-white">
            {TYPE_LABELS[goal.type]}
          </p>
          <p className="text-[11px] text-[#565B64] capitalize">
            {goal.period}ly goal
          </p>
        </div>
        <button
          onClick={() => onDelete(goal.id)}
          className="text-[11px] text-[#565B64] hover:text-red-400"
        >
          Remove
        </button>
      </div>
      <div className="flex justify-between text-xs mb-2">
        <span className="text-[#C9CDD3]">
          {goal.current} / {goal.target}
        </span>
        <span className="text-[#565B64]">{goal.pct}%</span>
      </div>
      <div className="bg-[#1D222A] rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${goal.pct >= 100 ? "bg-[#3ECF8E]" : "bg-[#4FA3F7]"}`}
          style={{ width: `${goal.pct}%` }}
        />
      </div>
    </div>
  );
}

function NewGoalForm({ onCreate }) {
  const [type, setType] = useState("commits");
  const [period, setPeriod] = useState("week");
  const [target, setTarget] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!target || Number(target) <= 0) {
      setError("Enter a target greater than 0");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onCreate({ type, period, target: Number(target) });
      setTarget("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#12161D] rounded-xl p-5 mb-6">
      <p className="text-sm font-semibold text-white mb-4">Set a new goal</p>
      <div className="flex flex-col md:flex-row gap-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="text-xs bg-[#151A21] text-[#C9CDD3] px-3 py-2 rounded-lg flex-1"
        >
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="text-xs bg-[#151A21] text-[#C9CDD3] px-3 py-2 rounded-lg flex-1"
        >
          <option value="week">This week</option>
          <option value="month">This month</option>
        </select>
        <input
          type="number"
          min="1"
          placeholder="Target (e.g. 20)"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="text-xs bg-[#151A21] text-[#C9CDD3] px-3 py-2 rounded-lg flex-1 outline-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="text-xs bg-[#3ECF8E] text-[#05070A] font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add Goal"}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-400 mt-2">{error}</p>}
    </form>
  );
}

export default function Goals() {
  const [goals, setGoals] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    api.goals
      .list()
      .then((d) => setGoals(d.goals))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(goal) {
    await api.goals.create(goal);
    load();
  }

  async function handleDelete(id) {
    await api.goals.remove(id);
    load();
  }

  if (error) return <div className="p-8 text-red-400 text-sm">{error}</div>;
  if (!goals)
    return <div className="p-8 text-[#8A8F99] text-sm">Loading...</div>;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">Goals</h1>
        <p className="text-xs text-[#8A8F99]">
          Targets you set — measured against what actually happened.
        </p>
      </div>

      <NewGoalForm onCreate={handleCreate} />

      {goals.length === 0 && (
        <p className="text-sm text-[#565B64]">
          No goals set yet — add one above.
        </p>
      )}
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} onDelete={handleDelete} />
      ))}
    </div>
  );
}
