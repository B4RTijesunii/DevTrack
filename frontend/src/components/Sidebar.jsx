import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/overview", label: "Overview", icon: "🏠" },
  { to: "/projects", label: "Projects", icon: "📁" },
  { to: "/analytics", label: "Analytics", icon: "📊" },
  { to: "/milestones", label: "Milestones", icon: "🚩" },
  { to: "/goals", label: "Goals", icon: "🎯" },
  { to: "/reports", label: "Reports", icon: "📄" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar({ user, streak }) {
  return (
    <div className="hidden md:flex w-[220px] bg-[#0A0C10] p-6 flex-col border-r border-[#1D222A] shrink-0">
      <div className="flex items-center gap-2 mb-7">
        <span className="text-[#3ECF8E] text-xl">{"</>"}</span>
        <span className="text-white font-bold text-base">DevTrack</span>
      </div>

      <nav className="flex flex-col gap-0.5 mb-7">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ${
                isActive
                  ? "bg-[#151A21] text-white"
                  : "text-[#8A8F99] hover:text-white"
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <p className="text-[10px] text-[#565B64] uppercase tracking-wide mb-2">
        Connected account
      </p>
      <div className="flex items-center gap-2 mb-6">
        <span>🐙</span>
        <span className="text-xs text-[#C9CDD3]">{user?.username}</span>
      </div>

      <div className="bg-[#12161D] rounded-xl p-3.5 mt-auto">
        <p className="text-[11px] text-[#8A8F99] mb-1.5">Current Streak</p>
        <p className="text-lg text-white mb-1.5">
          🔥 {streak?.current ?? 0} days
        </p>
        <p className="text-[10px] text-[#565B64]">
          Longest: {streak?.longest ?? 0} days
        </p>
      </div>
    </div>
  );
}
