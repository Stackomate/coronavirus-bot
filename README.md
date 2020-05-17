# Coronavirus Telegram Bot

A Telegram Bot for keeping track of Coronavirus cases in Brazil.

## It's Working

Check it out at http://t.me/CoronavirusBRBot

**NOTE:** This project is still under development. The bot was made in a rush, so the code quality can be improved.


## How to Setup

**NOTE:** You must have Node.js installed to run this project.

**NOTE:** You must first create a bot in Telegram. Check this guide and repeat steps from 1 to 4: 
https://www.sohamkamani.com/blog/2016/09/21/making-a-telegram-bot/

**NOTE:** You must have git installed to run this project (Well, you probably already have it anyways).

**NOTE:** You must create a Google Drive API to get the sheets contents. For more information, check: https://developers.google.com/drive/api/v3/enable-drive-api.
Follow step 1 from https://developers.google.com/drive/api/v3/quickstart/nodejs. Copy the credentials.json file into the root of this project.

Please store the token safely for later use!

1. ```git clone https://github.com/Stackomate/coronavirus-bot```
2. ```cd coronavirus-bot && npm ci```
3. Download https://chromedriver.storage.googleapis.com/index.html?path=80.0.3987.106/ for your specific operating system.
Place the downloaded file (`chromedriver`) inside root project folder.
4. Find your telegram Chat Id number. Send `/my_id` to https://t.me/get_id_bot
5. Create a `.env` file as following:
```
BOT_TOKEN = 'my-secret-token-here'
ADMIN_ID = [Your Telegram Chat Id here as a number, without the brackets. E.g.: 12345678]
SHEETS_FILE_ID = '1MWQE3s4ef6dxJosyqvsFaV4fDyElxnBUB6gMGvs3rEc'
SHEETS_FILE_PATH = './sheets.csv'
WCOTA_REPO_URL = 'https://github.com/wcota/covid19br'
WCOTA_REPO_PATH = 'unofficial-data'
```
6. Run ```node index.js```

**Important:** During the first run, Google drive API will provide instructions in your console to create the credentials. They're required to fetch the values from Google Sheets.