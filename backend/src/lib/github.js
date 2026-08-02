import fetch from "node-fetch";

const BASE = "https://api.github.com";

async function githubFetch(token, path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "DevTrack",
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${path} failed: ${res.status} ${body}`);
  }
  return res.json();
}

export function getUserRepos(token) {
  return githubFetch(
    token,
    "/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator",
  );
}

export function getRepoCommits(token, fullName, sinceISODate) {
  return githubFetch(
    token,
    `/repos/${fullName}/commits?since=${sinceISODate}&per_page=100`,
  );
}

export function getCommitStats(token, fullName, sha) {
  return githubFetch(token, `/repos/${fullName}/commits/${sha}`);
}

export function getRepoPulls(token, fullName) {
  return githubFetch(token, `/repos/${fullName}/pulls?state=all&per_page=100`);
}

export async function getRepoIssues(token, fullName) {
  const items = await githubFetch(
    token,
    `/repos/${fullName}/issues?state=all&per_page=100`,
  );
  return items.filter((item) => !item.pull_request);
}
