/* TODO: Load .env in this file too? */

const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

const sheetsFilePath = process.env.SHEETS_FILE_PATH;

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';



/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
  const drive = google.drive({ version: 'v3', auth });
  drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log('No files found.');
    }
  });
}


function getModifiedTime(drive, fileId) {
  return new Promise((resolve, reject) => {
    drive.files.get({fileId, fields:'modifiedTime'}, (err, d) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(d.data.modifiedTime)
    })    
  })
}

function exportToCSV(drive, fileId) {
  return new Promise((resolve, reject) => {
    drive.files.export({
      fileId: fileId,
      mimeType: 'text/csv'
    }, (err, buf) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(buf.data)
    })    
  })
}

function downloadFile(resolve, reject) {
  return function (auth) {
    const drive = google.drive({ version: 'v3', auth });

    var fileId = process.env.SHEETS_FILE_ID;

    Promise.all([getModifiedTime(drive, fileId), exportToCSV(drive, fileId)]).then(([time, data]) => {

      fs.writeFileSync(sheetsFilePath, data);
      
      const results = []
      let totalCount = null;
      let stateInfo = [];

      let totalSuspects = null;
      let stateSuspects = [];

      let totalRecovered = null;
      let stateRecovered = [];
      
      require('fs').createReadStream(
        require('path').relative(__dirname, sheetsFilePath)
      ).pipe(
        require('csv-parser')(['Estado', 'Casos'])
      ).on('data', (data) => {
        results.push(data)
      }).on('end', () => {
        stateInfo = results.slice(3, 31).map(i => ({ state: i[1], cases: i[2] }));
        totalCount = results[3]['2'];

        stateSuspects = results.slice(35, 63).map(i => ({ state: i[1], suspects: i[3] }));
        totalSuspects = results[35]['3'];

        stateRecovered = results.slice(67, 95).map(i => ({ state: i[1], recovered: i[4] }))
        totalRecovered = results[67]['4'];

        resolve({ 
          totalCount: parseInt(totalCount), 
          totalSuspects: parseInt(totalSuspects), 
          stateSuspects,
          stateInfo, 
          totalRecovered: parseInt(totalRecovered),
          stateRecovered,
          date: new Date(time).toLocaleString("pt-BR") 
        });
      })

    }).catch(e => {
      console.log('ERRORED', e)
      reject(e);
    })
  }
}









module.exports = () => new Promise((resolve, reject) => {
  // Load client secrets from a local file.
  fs.readFile('credentials.json', (err, content) => {
    if (err) {
      reject(err);
      return;
    }
    // Authorize a client with credentials, then call the Google Drive API.
    authorize(JSON.parse(content), downloadFile(resolve, reject));
  });
})