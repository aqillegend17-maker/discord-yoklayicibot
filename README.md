# TalkLand AI Tester (v1)

A Discord bot for basic Minecraft Java server status checks and simple log-pattern analysis.

## Commands
- `/testserver` — checks whether the Minecraft server responds, and shows version, player count and response time.
- `/analiz fayl:<file>` — checks a `.log` or `.txt` file for common Skript/plugin/server error patterns.

## Important limitations
- `/testserver` cannot verify that in-game commands or plugins actually work.
- `/analiz` is a rule-based first pass, not a full AI model; it can miss errors or flag harmless lines.
- The bot does not join the Minecraft server, modify files, or execute admin commands.

## Setup
1. Install Node.js 18 or newer.
2. Create a Discord application at https://discord.com/developers/applications and add a Bot.
3. Copy `.env.example` to `.env` and fill in `DISCORD_TOKEN` and `CLIENT_ID`. Optionally fill `GUILD_ID` to register commands just for your Discord server during testing.
4. Invite the bot to your Discord server with the `bot` and `applications.commands` scopes. It needs permission to send messages and embed links.
5. Run `npm install`, then `npm start`.

Never share your bot token or upload `.env` to GitHub. If a token leaks, reset it in the Discord Developer Portal.

## TalkLand server defaults
`TalkLandBoxPVP.aternos.me:40781` — edit `MC_HOST` / `MC_PORT` in `.env` if this changes.
