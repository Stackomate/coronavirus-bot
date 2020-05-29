import TelegramBot from 'node-telegram-bot-api';
import {Builder, By, until} from 'selenium-webdriver';
import fs from 'fs';
import strings from '../strings';
import { setDefaultValues, mountDBObject } from './utils/dbutils';
import low from 'lowdb';
import  { adapter } from './utils/dbutils';
//TODO: find out why I can't import dotenv
/* Load dotenv before code to apply environment variables */
require('dotenv').config()
//TODO: find out why I can't import AsciiTable
const AsciiTable = require('ascii-table');

/* Secret, Personal Telegram Token given by botfather */
const token: string | undefined = process.env.BOT_TOKEN;

/* DB-Related */
const db = low(adapter);
setDefaultValues(db);
mountDBObject(db);

/** Used for /debug command */
//TODO: add types
let lastDebug = {}
/** Used by admin to send bulk messages */
//TODO: add types
let admBulkMessages = {}

/* 
    Important! I froze my computer because I did not have this defined.
    Time to update in miliseconds.
 */
const timeToUpdate = 1000 * 60 * 15; // 15 minutes

