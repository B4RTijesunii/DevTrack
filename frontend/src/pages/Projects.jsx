import { useEffect, useState } from "react";
import { api } from "../lib/api";

function StatusBadge({ status, daysSinceLastCommit }) {
  if (status === "active") {
    return (
      <span className="text-[10px] bg-[#12261F] text-[#3ECF8E] px-2.5 py-1 rounded-md">
        Active
      </span>
    );
  }
  if (status === "quiet") {
    return (
      <span className="text-[10px] bg-[#1D222A] text-[#8A8F99] px-2.5 py-1 rounded-md">
        Quiet · {daysSinceLastCommit}d ago
      </span>
    );
  }
  return (
    <span className="text-[10px] bg-[#1D222A] text-[#565B64] px-2.5 py-1 rounded-md">
      No data
    </span>
  );
}

function ProjectCard({ project }) {
  return (
    <div className="bg-[#12161D] rounded-xl p-5 mb-3">
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-sm font-semibold text-white">{project.name}</p>
          <p className="text-[11px] text-[#565B64] mt-0.5">
            {project.fullName}
          </p>
        </div>
        <StatusBadge
          status={project.status}
          daysSinceLastCommit={project.daysSinceLastCommit}
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-[10px] text-[#565B64] mb-1">Commits (30d)</p>
          <p className="text-white font-medium">{project.commits}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#565B64] mb-1">Active Days</p>
          <p className="text-white font-medium">{project.activeDays}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#565B64] mb-1">PRs Merged</p>
          <p className="text-white font-medium">{project.prsMerged}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#565B64] mb-1">Lines +/-</p>
          <p className="font-medium">
            <span className="text-[#3ECF8E]">+{project.linesAdded}</span>{" "}
            <span className="text-[#565B64]">-{project.linesDeleted}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .projects()
      .then((data) => setProjects(data.projects))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div className="p-8 text-red-400 text-sm">{error}</div>;
  }
  if (!projects) {
    return <div className="p-8 text-[#8A8F99] text-sm">Loading...</div>;
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">Projects</h1>
        <p className="text-xs text-[#8A8F99]">
          Every repo you're tracked on, at a glance.
        </p>
      </div>

      {projects.length === 0 && (
        <p className="text-sm text-[#565B64]">No repos synced yet.</p>
      )}

      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
