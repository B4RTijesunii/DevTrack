import { prisma } from "../lib/prisma.js";
import { generateText } from "../lib/groq.js";
import {
  startOfMonth,
  endOfMonth,
  getUserRepoIds,
  getCommitsInRange,
  dayKey,
} from "./stats.js";

async function getMonthlyRawStats(userId, monthDate) {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);

  const commits = await getCommitsInRange(userId, start, end);
  const repos = await getUserRepoIds(userId);
  const repoIds = repos.map((r) => r.id);

  const activeDateKeys = new Set(commits.map((c) => dayKey(c.authoredAt)));
  const repoNames = new Set(commits.map((c) => c.repo.name));

  const perRepoCounts = {};
  for (const c of commits) {
    perRepoCounts[c.repo.name] = (perRepoCounts[c.repo.name] ?? 0) + 1;
  }
  const topRepo = Object.entries(perRepoCounts).sort((a, b) => b[1] - a[1])[0];

  const linesAdded = commits.reduce((sum, c) => sum + c.additions, 0);
  const linesDeleted = commits.reduce((sum, c) => sum + c.deletions, 0);

  const [prsMerged, issuesClosed] = repoIds.length
    ? await Promise.all([
        prisma.pullRequest.count({
          where: { repoId: { in: repoIds }, mergedAt: { gte: start, lt: end } },
        }),
        prisma.issue.count({
          where: { repoId: { in: repoIds }, closedAt: { gte: start, lt: end } },
        }),
      ])
    : [0, 0];

  const perDayCounts = {};
  for (const c of commits) {
    const key = dayKey(c.authoredAt);
    perDayCounts[key] = (perDayCounts[key] ?? 0) + 1;
  }
  const busiestDay = Object.entries(perDayCounts).sort(
    (a, b) => b[1] - a[1],
  )[0];

  return {
    start,
    end,
    totalCommits: commits.length,
    activeDays: activeDateKeys.size,
    reposTouched: repoNames.size,
    topRepoName: topRepo?.[0] ?? null,
    topRepoCommits: topRepo?.[1] ?? 0,
    linesAdded,
    linesDeleted,
    prsMerged,
    issuesClosed,
    busiestDayDate: busiestDay?.[0] ?? null,
    busiestDayCommits: busiestDay?.[1] ?? 0,
  };
}

function buildPrompt(stats) {
  return `You are writing a short, encouraging monthly developer activity review for a solo developer, based only on the real GitHub data below. Do not invent any numbers or details not listed here. Do not mention "coding time," "focus," or estimate hours worked — only commits, repos, PRs, issues, and lines of code are real data. Write 3-4 sentences, warm but grounded, no exclamation-point overload.

Data for this month:
- Total commits: ${stats.totalCommits}
- Active days: ${stats.activeDays}
- Repos touched: ${stats.reposTouched}
- Most active repo: ${stats.topRepoName ?? "none"} (${stats.topRepoCommits} commits)
- Lines added: ${stats.linesAdded}, lines removed: ${stats.linesDeleted}
- Pull requests merged: ${stats.prsMerged}
- Issues closed: ${stats.issuesClosed}
- Busiest single day: ${stats.busiestDayDate ?? "none"} (${stats.busiestDayCommits} commits)

Write the review now.`;
}

export async function generateMonthlyReview(userId, monthDate = new Date()) {
  const stats = await getMonthlyRawStats(userId, monthDate);
  const prompt = buildPrompt(stats);
  const aiSummary = await generateText(prompt);

  const summary = await prisma.periodSummary.upsert({
    where: {
      userId_periodType_periodStart: {
        userId,
        periodType: "month",
        periodStart: stats.start,
      },
    },
    update: {
      periodEnd: stats.end,
      totalCommits: stats.totalCommits,
      activeDays: stats.activeDays,
      reposTouched: stats.reposTouched,
      prsMerged: stats.prsMerged,
      issuesClosed: stats.issuesClosed,
      linesAdded: stats.linesAdded,
      linesDeleted: stats.linesDeleted,
      aiSummary,
    },
    create: {
      userId,
      periodType: "month",
      periodStart: stats.start,
      periodEnd: stats.end,
      totalCommits: stats.totalCommits,
      activeDays: stats.activeDays,
      reposTouched: stats.reposTouched,
      prsMerged: stats.prsMerged,
      issuesClosed: stats.issuesClosed,
      linesAdded: stats.linesAdded,
      linesDeleted: stats.linesDeleted,
      aiSummary,
    },
  });

  return summary;
}

export async function getLatestMonthlyReview(userId) {
  return prisma.periodSummary.findFirst({
    where: { userId, periodType: "month" },
    orderBy: { periodStart: "desc" },
  });
}
