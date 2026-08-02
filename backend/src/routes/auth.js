import { Router } from "express";
import fetch from "node-fetch";
import { prisma } from "../lib/prisma.js";
import { encrypt } from "../lib/crypto.js";

const router = Router();

const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_CALLBACK_URL,
  FRONTEND_URL,
} = process.env;

const SCOPES = "repo read:user";

router.get("/github", (req, res) => {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_CALLBACK_URL,
    scope: SCOPES,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get("/github/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.redirect(`${FRONTEND_URL}/login?error=missing_code`);
  }

  try {
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

    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "DevTrack",
      },
    });
    const githubUser = await userRes.json();

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

    req.session.userId = user.id;
    console.log(
      "[DEBUG] Session set for user:",
      user.id,
      "| NODE_ENV:",
      process.env.NODE_ENV,
    );
    res.redirect(`${FRONTEND_URL}/overview`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.redirect(`${FRONTEND_URL}/login?error=server_error`);
  }
});

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
