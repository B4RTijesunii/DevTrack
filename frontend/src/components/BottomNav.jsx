import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/overview", icon: "🏠" },
  { to: "/projects", icon: "📁" },
  { to: "/analytics", icon: "📊" },
  { to: "/goals", icon: "🎯" },
  { to: "/settings", icon: "⚙️" },
];

export default function BottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0C10] border-t border-[#1D222A] flex justify-around py-3 z-10">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `text-lg ${isActive ? "opacity-100" : "opacity-40"}`
          }
        >
          {item.icon}
        </NavLink>
      ))}
    </div>
  );
}
