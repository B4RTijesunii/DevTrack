import { prisma } from "../lib/prisma.js";
import { decrypt } from "../lib/crypto.js";
import {
  getUserRepos,
  getRepoCommits,
  getCommitStats,
  getRepoPulls,
  getRepoIssues,
} from "../lib/github.js";

const DEFAULT_LOOKBACK_DAYS = 90;
const MAX_STATS_CALLS_PER_REPO = 30;

export async function syncUser(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const token = decrypt(user.accessToken);
  const summary = {
    reposFound: 0,
    commitsAdded: 0,
    pullRequestsAdded: 0,
    issuesAdded: 0,
  };

  const ghRepos = await getUserRepos(token);
  summary.reposFound = ghRepos.length;

  for (const ghRepo of ghRepos) {
    const repo = await prisma.repo.upsert({
      where: { githubRepoId: String(ghRepo.id) },
      update: {
        name: ghRepo.name,
        fullName: ghRepo.full_name,
        isPrivate: ghRepo.private,
      },
      create: {
        githubRepoId: String(ghRepo.id),
        name: ghRepo.name,
        fullName: ghRepo.full_name,
        isPrivate: ghRepo.private,
        userId: user.id,
      },
    });

    const since = repo.lastSyncedAt
      ? repo.lastSyncedAt.toISOString()
      : new Date(
          Date.now() - DEFAULT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
        ).toISOString();

    let commits = [];
    try {
      commits = await getRepoCommits(token, repo.fullName, since);
    } catch (err) {
      console.error(`Skipping commits for ${repo.fullName}:`, err.message);
    }

    let statsCallsUsed = 0;
    for (const c of commits) {
      let additions = 0;
      let deletions = 0;

      if (statsCallsUsed < MAX_STATS_CALLS_PER_REPO) {
        try {
          const detail = await getCommitStats(token, repo.fullName, c.sha);
          additions = detail.stats?.additions ?? 0;
          deletions = detail.stats?.deletions ?? 0;
          statsCallsUsed++;
        } catch {
          // fine to skip
        }
      }

      await prisma.commit.upsert({
        where: { repoId_sha: { repoId: repo.id, sha: c.sha } },
        update: {},
        create: {
          repoId: repo.id,
          sha: c.sha,
          message: c.commit.message.split("\n")[0],
          additions,
          deletions,
          authoredAt: new Date(c.commit.author.date),
          url: c.html_url,
        },
      });
      summary.commitsAdded++;
    }

    try {
      const pulls = await getRepoPulls(token, repo.fullName);
      for (const pr of pulls) {
        await prisma.pullRequest.upsert({
          where: {
            repoId_githubPrId: { repoId: repo.id, githubPrId: String(pr.id) },
          },
          update: {
            state: pr.merged_at ? "merged" : pr.state,
            mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
          },
          create: {
            repoId: repo.id,
            githubPrId: String(pr.id),
            title: pr.title,
            state: pr.merged_at ? "merged" : pr.state,
            createdAt: new Date(pr.created_at),
            mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
          },
        });
        summary.pullRequestsAdded++;
      }
    } catch (err) {
      console.error(`Skipping PRs for ${repo.fullName}:`, err.message);
    }

    try {
      const issues = await getRepoIssues(token, repo.fullName);
      for (const issue of issues) {
        await prisma.issue.upsert({
          where: {
            repoId_githubIssueId: {
              repoId: repo.id,
              githubIssueId: String(issue.id),
            },
          },
          update: {
            state: issue.state,
            closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
          },
          create: {
            repoId: repo.id,
            githubIssueId: String(issue.id),
            title: issue.title,
            state: issue.state,
            createdAt: new Date(issue.created_at),
            closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
          },
        });
        summary.issuesAdded++;
      }
    } catch (err) {
      console.error(`Skipping issues for ${repo.fullName}:`, err.message);
    }

    await prisma.repo.update({
      where: { id: repo.id },
      data: { lastSyncedAt: new Date() },
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastSyncedAt: new Date() },
  });

  return summary;
}
