import TelegramBot from 'node-telegram-bot-api';
import {Builder, By, until} from 'selenium-webdriver';
import fs from 'fs';
import strings from '../strings';
import { setDefaultValues, mountDBObject } from './utils/dbutils';

//DB imports
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';

/* Load dotenv before code to apply environment variables */
require('dotenv').config()

/* Secret, Personal Telegram Token given by botfather */
const token = process.env.BOT_TOKEN;

const AsciiTable = require('ascii-table');

/* DB-Related */
const adapter = new FileSync('db.json');
const db = low(adapter);
setDefaultValues(db);
mountDBObject(db);

/** Used for /debug command */
let lastDebug = {}
/** Used by admin to send bulk messages */
let admBulkMessages = {}

/* 
    Important! I froze my computer because I did not have this defined.
    Time to update in miliseconds.
 */
const timeToUpdate = 1000 * 60 * 15; // 15 minutes

