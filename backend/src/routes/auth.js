import { Router } from "express";
import fetch from "node-fetch";
import { prisma } from "../lib/prisma.js";
import { encrypt } from "../lib/crypto.js";
import { syncUser } from "../services/sync.js";

const router = Router();

const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_CALLBACK_URL,
  FRONTEND_URL,
} = process.env;

// Scopes: "repo" gives read access to private repos too, not just public
// ones. If you only ever want to track public work, swap this for
// "public_repo read:user" instead — smaller scope, less scary consent
// screen for anyone else who ever uses this.
const SCOPES = "repo read:user";

// Step 1 of the flow: send the user to GitHub to approve access
router.get("/github", (req, res) => {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_CALLBACK_URL,
    scope: SCOPES,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// Step 2: GitHub redirects back here with a one-time code
router.get("/github/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.redirect(`${FRONTEND_URL}/login?error=missing_code`);
  }

  try {
    // Exchange the code for a real access token
    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: GITHUB_CALLBACK_URL,
        }),
      },
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error(
        "GitHub token exchange failed:",
        tokenData.error_description,
      );
      return res.redirect(`${FRONTEND_URL}/login?error=token_exchange_failed`);
    }

    const accessToken = tokenData.access_token;

    // Use the token to find out who this is
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "DevTrack",
      },
    });
    const githubUser = await userRes.json();

    // Check if this is a brand-new user, before the upsert overwrites anything
    const existingUser = await prisma.user.findUnique({
      where: { githubId: String(githubUser.id) },
    });
    const isFirstLogin = !existingUser;

    // Create or update the User row, storing the token encrypted
    const user = await prisma.user.upsert({
      where: { githubId: String(githubUser.id) },
      update: {
        username: githubUser.login,
        avatarUrl: githubUser.avatar_url,
        accessToken: encrypt(accessToken),
      },
      create: {
        githubId: String(githubUser.id),
        username: githubUser.login,
        avatarUrl: githubUser.avatar_url,
        accessToken: encrypt(accessToken),
      },
    });

    // Start a session — just the user id, nothing sensitive
    req.session.userId = user.id;

    // First-time users get an automatic background sync, so they don't
    // land on an empty dashboard. Don't await it — redirect immediately
    // and let it run in the background; the frontend shows a syncing
    // state until data shows up.
    if (isFirstLogin) {
      syncUser(user.id).catch((err) => {
        console.error(
          `Background first-sync failed for ${user.username}:`,
          err.message,
        );
      });
    }

    res.redirect(`${FRONTEND_URL}/overview`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.redirect(`${FRONTEND_URL}/login?error=server_error`);
  }
});

// Lets the frontend check "am I logged in, and as who"
router.get("/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    select: { id: true, username: true, avatarUrl: true, lastSyncedAt: true },
  });
  res.json({ user });
});

router.post("/logout", (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

export default router;
