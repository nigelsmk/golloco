const TeleBot = require('telebot');
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
// var schedule = require('node-schedule-tz');
var CronJob = require('cron').CronJob;
require('dotenv').config()

const bot = new TeleBot(process.env.TELEGRAM_BOT_TOKEN);
let message;
let row = 0;
let linkText;

bot.on('/hello', (msg) => {
    if (msg.chat.id == -1001290400104 && msg.from.id == 114655573) { //-1001321929443
        return bot.sendMessage(msg.chat.id, `Hello ${msg.from.first_name}, I'm Mali and I love to share travel tips and hacks!`, { replyToMessage: msg.message_id });
    }
});

bot.on('/helloMali', (msg) => {
    console.log(msg.from.id);
    if (msg.chat.id == -1001290400104 && msg.from.id == 114655573) { //-1001321929443 //own user id: 114655573
        message = msg;

        fs.readFile('credentials.json', (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);
            // Authorize a client with credentials, then call the Google Sheets API.

            const job = new CronJob({
                // 20 23 * * 0-6
                cronTime: '16 16 * * 0-6',
                onTick: function () {
                    authorize(JSON.parse(content), printTravelArticles);
                },
                start: true,
                timeZone: 'Asia/Singapore'
            });


        });

        return bot.sendMessage(msg.chat.id, `Hello everyone, I'm Mali and I love to share travel tips and hacks!`);
    }
});

bot.start();

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
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
    try {
        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, (err, token) => {
            if (err) return getNewToken(oAuth2Client, callback);
            oAuth2Client.setCredentials(JSON.parse(token));
            callback(oAuth2Client);
        });
    } catch (err) {
        console.log(err);
    }
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
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
            if (err) return callback(err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

function printTravelArticles(auth) {
    console.log('inside cron. before row: ' + row);
    const sheets = google.sheets({ version: 'v4', auth });
    sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
        range: 'Travel Links Data!A2:B',
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const data = res.data.values;

        if (data.length) {
            if (typeof data[row] !== 'undefined') {
                console.log("before row: " + row);
                linkText = data[row][0] + " " + data[row][1];
                bot.sendMessage(message.chat.id, linkText);
                row++;
                console.log("after row: " + row);
            }

        } else {
            console.log('No data found.');
        }
    });
}