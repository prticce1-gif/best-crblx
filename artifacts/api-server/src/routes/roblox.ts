import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/* ── Verify Roblox username + account age + avatar ─────────── */
router.post("/roblox/verify", async (req, res) => {
  const { username } = req.body as { username?: string };

  if (!username || typeof username !== "string") {
    res.status(400).json({ error: "Username is required" });
    return;
  }

  try {
    // Resolve username → userId
    const searchRes = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usernames: [username.trim()],
        excludeBannedUsers: false,
      }),
    });

    const searchData = (await searchRes.json()) as {
      data?: { id: number; name: string }[];
    };

    if (!searchData.data || searchData.data.length === 0) {
      res.json({ valid: false, found: false, error: "User not found" });
      return;
    }

    const userId = searchData.data[0].id;

    // Fetch user profile + avatar in parallel
    const [userRes, avatarRes] = await Promise.all([
      fetch(`https://users.roblox.com/v1/users/${userId}`),
      fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`,
      ),
    ]);

    const userData = (await userRes.json()) as {
      id: number;
      name: string;
      displayName: string;
      created: string;
    };

    const avatarData = (await avatarRes.json()) as {
      data?: { targetId: number; state: string; imageUrl: string }[];
    };

    const avatarUrl =
      avatarData.data?.[0]?.imageUrl ?? null;

    const created = new Date(userData.created);
    const now = new Date();
    const accountAgeDays = Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
    );

    res.json({
      found: true,
      valid: accountAgeDays >= 80,
      username: userData.name,
      displayName: userData.displayName,
      userId,
      accountAgeDays,
      created: userData.created,
      avatarUrl,
    });
  } catch (err) {
    logger.error({ err }, "Failed to verify Roblox user");
    res.status(500).json({ error: "Failed to verify user" });
  }
});

/* ── Forward log event to Discord webhook ─────────────────── */
router.post("/log", async (req, res) => {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    res.status(500).json({ error: "Webhook not configured" });
    return;
  }

  const { event, data } = req.body as {
    event?: string;
    data?: Record<string, unknown>;
  };

  try {
    const fields = Object.entries(data ?? {}).map(([name, value]) => ({
      name,
      value: String(value),
      inline: true,
    }));

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: `🔔 ${event ?? "Log Event"}`,
            color: 0x3b82f6,
            fields,
            timestamp: new Date().toISOString(),
            footer: { text: "Roblox Condo • Sistema de Logs" },
          },
        ],
      }),
    });

    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Failed to send Discord webhook");
    res.status(500).json({ error: "Failed to send log" });
  }
});

export default router;
