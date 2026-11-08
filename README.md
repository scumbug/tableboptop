# tableboptop

## Description
Simple discord bot to send docker commands to Satisfactory server hosted on docker via discord.

You will need to run the bot in the same docker instance as your server

This bot is tested on the @ich777 Satisfactory container but should work on any dockerize Satisfactory server https://github.com/ich777/docker-steamcmd-server/tree/satisfactory

## Commands

|  Command |  Action |
| ------------ | ------------ |
| /restart-factory  |  Start or restart server |
| /stop-factory  |  Stop server |
| /grab-save | Grabs save files from your server |
| /factory-status | Shows CPU and ram usage of your server |

## Requirements

- Satisfactory server running on a docker container
- Discord bot must run on the same docker instance
- Node 16.xx

## Setup
1. Setup your own app and create a bot. You can follow the guide here (https://discordjs.guide/preparations/setting-up-a-bot-application.html)
2. Clone the project `git clone https://github.com/scumbug/tableboptop.git`
3. Run `npm i` to install all dependencies
4. Create a new file `.env` in the project root and add environment variables (listed below)
5. Register commands to your bot via `node setup.js`

## Deployment
1. Pull the container from docker hub https://hub.docker.com/r/scumbug/tableboptop
2. Run the container with the following environment variables and path declared

```bash
docker run \
    --name tableboptop \
    -v /var/run/docker.sock:/var/run/docker.sock \
	-e "TOKEN=yourtokenhere" \
	-e "CLIENTID=yourclientid" \
	-e "FACTORYCONTAINER=containerid" \
	-e "SAVEDIR=/serverdata/serverfiles/.config/Epic/FactoryGame/Saved/SaveGames" \
    tableboptop
```

## Environment Variables
| Key  | Description  |
| ------------ | ------------ |
| TOKEN  | Your discord bot token  |
| CLIENTID  | Your discord application ID  |
| BLIZZ_CLIENT_ID | Blizzard API client ID (used by retail and Forever monitoring) |
| BLIZZ_CLIENT_SECRET | Blizzard API client secret |
| BLIZZ_CHN | Discord channel ID for retail and Forever status alerts |
| FROSTMOURNE | Retail connected-realm ID to monitor (Frostmourne is `3725`) |
| FACTORYCONTAINER | Container ID of your Satisfactory server |
| SAVEDIR | Save directory on your satisfactory server (default should be /serverdata/serverfiles/.config/Epic/FactoryGame/Saved/SaveGames) |

## WoW monitoring

The bot checks retail and WoW Forever status every minute. The first successful check
establishes a baseline; subsequent status changes send a message to `BLIZZ_CHN`.

Forever monitoring covers **Americas & Oceania, PvE only**. It calls Blizzard's
`GET https://us.api.blizzard.com/data/wow/ruleset/2` with namespace
`dynamic-forever-us` and locale `en_US`. Forever uses rulesets instead of connected
realms; PvE (Normal) is ruleset `2`. No additional environment variables are needed beyond
the existing Blizzard credentials and channel. A notification looks like
`WoW Forever (Americas & Oceania, PvE) is DOWN`.

Both monitors use Blizzard API OAuth credentials. Allow outbound HTTPS access to
`us.battle.net` (OAuth) and `us.api.blizzard.com` (game data).

Run the offline monitoring tests with `npm test`.

