# Coronavirus Telegram Bot

A Telegram Bot for keeping track of Coronavirus cases in Brazil.

## It's Working

Check it out at http://t.me/CoronavirusBRBot

**NOTE:** This project is still under development. The bot was made in a rush, so the code quality can be improved.


## How to Setup

**NOTE:** You must have Node.js installed to run this project.

**NOTE:** You must first create a bot in Telegram. Check this guide and repeat steps from 1 to 4: 
https://www.sohamkamani.com/blog/2016/09/21/making-a-telegram-bot/

Please store the token safely for later use!

1. ```git clone https://github.com/Stackomate/coronavirus-bot```
2. ```cd coronavirus-bot && npm ci```
3. Download https://chromedriver.storage.googleapis.com/index.html?path=80.0.3987.106/ for your specific operating system.
Place the downloaded file (`chromedriver`) inside root project folder.
4. Create a `.env` file as following:
```
BOT_TOKEN = 'my-secret-token-here'
```
5. Run ```node index.js```

