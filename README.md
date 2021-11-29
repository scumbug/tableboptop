# tableboptop

## Description
Simple discord bot to send docker commands to Satisfactory server hosted on docker via discord.

## Deployment
1. Setup your own app and create a bot. You can follow the guide here (https://discordjs.guide/preparations/setting-up-a-bot-application.html)
2. Pull the container from docker hub https://hub.docker.com/r/scumbug/tableboptop
3. Run the container with the following environment variables and path declared

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

