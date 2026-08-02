import { prisma } from "../lib/prisma.js";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  getUserRepoIds,
} from "./stats.js";

const VALID_TYPES = ["commits", "active_days", "prs_merged", "issues_closed"];
const VALID_PERIODS = ["week", "month"];

async function getCurrentValue(userId, type, period) {
  const now = new Date();
  const start = period === "week" ? startOfWeek(now) : startOfMonth(now);
  const end = period === "week" ? endOfWeek(now) : endOfMonth(now);

  const repos = await getUserRepoIds(userId);
  const repoIds = repos.map((r) => r.id);
  if (repoIds.length === 0) return 0;

  switch (type) {
    case "commits": {
      return prisma.commit.count({
        where: { repoId: { in: repoIds }, authoredAt: { gte: start, lt: end } },
      });
    }
    case "active_days": {
      const commits = await prisma.commit.findMany({
        where: { repoId: { in: repoIds }, authoredAt: { gte: start, lt: end } },
        select: { authoredAt: true },
      });
      const days = new Set(
        commits.map((c) => new Date(c.authoredAt).toISOString().slice(0, 10)),
      );
      return days.size;
    }
    case "prs_merged": {
      return prisma.pullRequest.count({
        where: { repoId: { in: repoIds }, mergedAt: { gte: start, lt: end } },
      });
    }
    case "issues_closed": {
      return prisma.issue.count({
        where: { repoId: { in: repoIds }, closedAt: { gte: start, lt: end } },
      });
    }
    default:
      return 0;
  }
}

export async function getGoalsWithProgress(userId) {
  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(
    goals.map(async (goal) => {
      const current = await getCurrentValue(userId, goal.type, goal.period);
      return {
        id: goal.id,
        type: goal.type,
        target: goal.target,
        period: goal.period,
        current,
        pct: Math.min(100, Math.round((current / goal.target) * 100)),
      };
    }),
  );
}

export async function createGoal(userId, { type, target, period }) {
  if (!VALID_TYPES.includes(type))
    throw new Error(`Invalid goal type: ${type}`);
  if (!VALID_PERIODS.includes(period))
    throw new Error(`Invalid period: ${period}`);
  if (!Number.isInteger(target) || target <= 0)
    throw new Error("Target must be a positive integer");

  return prisma.goal.create({
    data: { userId, type, target, period },
  });
}

export async function deleteGoal(userId, goalId) {
  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal || goal.userId !== userId) throw new Error("Goal not found");
  return prisma.goal.delete({ where: { id: goalId } });
}
