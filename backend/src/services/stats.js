import { prisma } from "../lib/prisma.js";

// --- Date helpers ---------------------------------------------------

export function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfWeek(date) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return end;
}

export function startOfMonth(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
}

export function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

// --- Core queries -----------------------------------------------------

export async function getUserRepoIds(userId) {
  const repos = await prisma.repo.findMany({
    where: { userId },
    select: { id: true, name: true },
  });
  return repos;
}

export async function getCommitsInRange(userId, start, end) {
  const repos = await getUserRepoIds(userId);
  const repoIds = repos.map((r) => r.id);
  if (repoIds.length === 0) return [];

  return prisma.commit.findMany({
    where: {
      repoId: { in: repoIds },
      authoredAt: { gte: start, lt: end },
    },
    include: { repo: { select: { name: true } } },
    orderBy: { authoredAt: "asc" },
  });
}

async function getAllActiveDateKeys(userId) {
  const repos = await getUserRepoIds(userId);
  const repoIds = repos.map((r) => r.id);
  if (repoIds.length === 0) return new Set();

  const commits = await prisma.commit.findMany({
    where: { repoId: { in: repoIds } },
    select: { authoredAt: true },
  });

  return new Set(commits.map((c) => dayKey(c.authoredAt)));
}

// --- Streak -------------------------------------------------------

function calcStreaks(activeDateKeys) {
  const sorted = [...activeDateKeys].sort();
  if (sorted.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = Math.round((curr - prev) / 86400000);
    run = diffDays === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  let cursor = activeDateKeys.has(today) ? today : yesterday;
  let current = 0;

  while (activeDateKeys.has(cursor)) {
    current++;
    cursor = dayKey(new Date(new Date(cursor).getTime() - 86400000));
  }

  return { current, longest };
}

// --- Public: everything the Overview page needs, in one call ------

export async function getOverviewStats(userId) {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekEnd = weekStart;

  const [thisWeekCommits, lastWeekCommits, activeDateKeys] = await Promise.all([
    getCommitsInRange(userId, weekStart, weekEnd),
    getCommitsInRange(userId, prevWeekStart, prevWeekEnd),
    getAllActiveDateKeys(userId),
  ]);

  const { current: currentStreak, longest: longestStreak } =
    calcStreaks(activeDateKeys);

  const thisWeekDateKeys = new Set(
    thisWeekCommits.map((c) => dayKey(c.authoredAt)),
  );
  const thisWeekRepoNames = new Set(thisWeekCommits.map((c) => c.repo.name));
  const lastWeekDateKeys = new Set(
    lastWeekCommits.map((c) => dayKey(c.authoredAt)),
  );
  const lastWeekRepoNames = new Set(lastWeekCommits.map((c) => c.repo.name));

  const commitsPerDay = [0, 0, 0, 0, 0, 0, 0];
  for (const c of thisWeekCommits) {
    const d = new Date(c.authoredAt);
    const idx = (d.getDay() + 6) % 7;
    commitsPerDay[idx]++;
  }

  const perProject = {};
  for (const c of thisWeekCommits) {
    perProject[c.repo.name] = (perProject[c.repo.name] ?? 0) + 1;
  }

  const repos = await getUserRepoIds(userId);
  const repoIds = repos.map((r) => r.id);
  const [prsMergedThisWeek, issuesClosedThisWeek] = repoIds.length
    ? await Promise.all([
        prisma.pullRequest.count({
          where: {
            repoId: { in: repoIds },
            mergedAt: { gte: weekStart, lt: weekEnd },
          },
        }),
        prisma.issue.count({
          where: {
            repoId: { in: repoIds },
            closedAt: { gte: weekStart, lt: weekEnd },
          },
        }),
      ])
    : [0, 0];

  const pctChange = (curr, prev) => {
    if (prev === 0) return curr === 0 ? 0 : 100;
    return Math.round(((curr - prev) / prev) * 100);
  };

  return {
    range: { start: weekStart, end: weekEnd },
    totalCommits: {
      value: thisWeekCommits.length,
      deltaPct: pctChange(thisWeekCommits.length, lastWeekCommits.length),
    },
    activeDays: {
      value: thisWeekDateKeys.size,
      deltaPct: pctChange(thisWeekDateKeys.size, lastWeekDateKeys.size),
    },
    projectsWorkedOn: {
      value: thisWeekRepoNames.size,
      deltaPct: pctChange(thisWeekRepoNames.size, lastWeekRepoNames.size),
    },
    milestones: {
      prsMerged: prsMergedThisWeek,
      issuesClosed: issuesClosedThisWeek,
    },
    streak: { current: currentStreak, longest: longestStreak },
    commitsPerDay,
    projectBreakdown: Object.entries(perProject).map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / (thisWeekCommits.length || 1)) * 100),
    })),
  };
}
// --- Per-project stats, for the Projects page ------------------------

const QUIET_THRESHOLD_DAYS = 7;

export async function getProjectsOverview(userId) {
  const repos = await prisma.repo.findMany({
    where: { userId },
    orderBy: { lastSyncedAt: "desc" },
  });

  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const results = await Promise.all(
    repos.map(async (repo) => {
      const commits = await prisma.commit.findMany({
        where: { repoId: repo.id, authoredAt: { gte: monthAgo } },
        orderBy: { authoredAt: "desc" },
      });

      const activeDateKeys = new Set(commits.map((c) => dayKey(c.authoredAt)));
      const linesAdded = commits.reduce((sum, c) => sum + c.additions, 0);
      const linesDeleted = commits.reduce((sum, c) => sum + c.deletions, 0);

      const [prsMerged, lastCommit] = await Promise.all([
        prisma.pullRequest.count({
          where: { repoId: repo.id, mergedAt: { gte: monthAgo } },
        }),
        prisma.commit.findFirst({
          where: { repoId: repo.id },
          orderBy: { authoredAt: "desc" },
        }),
      ]);

      const daysSinceLastCommit = lastCommit
        ? Math.floor((now - new Date(lastCommit.authoredAt)) / 86400000)
        : null;

      return {
        id: repo.id,
        name: repo.name,
        fullName: repo.fullName,
        isPrivate: repo.isPrivate,
        status:
          daysSinceLastCommit === null
            ? "no-data"
            : daysSinceLastCommit <= QUIET_THRESHOLD_DAYS
              ? "active"
              : "quiet",
        daysSinceLastCommit,
        commits: commits.length,
        activeDays: activeDateKeys.size,
        prsMerged,
        linesAdded,
        linesDeleted,
        lastCommitAt: lastCommit?.authoredAt ?? null,
      };
    }),
  );

  return results.sort((a, b) => {
    if (!a.lastCommitAt) return 1; // repos with no commits go last
    if (!b.lastCommitAt) return -1;
    return new Date(b.lastCommitAt) - new Date(a.lastCommitAt);
  });
}
