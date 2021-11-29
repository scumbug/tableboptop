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
| FACTORYCONTAINER | Container ID of your Satisfactory server |
| SAVEDIR | Save directory on your satisfactory server (default should be /serverdata/serverfiles/.config/Epic/FactoryGame/Saved/SaveGames) |

