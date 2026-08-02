import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/useAuth";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import Layout from "./components/Layout";
import Projects from "./pages/Projects";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#05070A]" />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Placeholder({ name }) {
  return (
    <div className="p-8 text-[#8A8F99] text-sm">{name} — coming soon.</div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/overview" element={<Overview />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/milestones" element={<Placeholder name="Milestones" />} />
        <Route path="/goals" element={<Placeholder name="Goals" />} />
        <Route path="/reports" element={<Placeholder name="Reports" />} />
        <Route path="/settings" element={<Placeholder name="Settings" />} />
      </Route>
      <Route path="*" element={<Navigate to="/overview" replace />} />
    </Routes>
  );
}
