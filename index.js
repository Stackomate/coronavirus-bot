/* Load dotenv before code to apply environment variables */
require('dotenv').config()

const TelegramBot = require('node-telegram-bot-api');

/* Secret, Personal Telegram Token given by botfather */
const token = process.env.BOT_TOKEN;

const AsciiTable = require('ascii-table');
const { Builder, By, until } = require('selenium-webdriver');

const fs = require('fs');
const strings = require('./strings')

/* DB-Related */
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('db.json')
const db = low(adapter)
// Set some defaults (required if your JSON file is empty)
db.defaults({
    chats: [],
    count: null,
    unofficialCount: null,
    unofficialStateInfo: null,
    unofficialDeaths: null,
    deaths: '0',
    MSUpdate: '',
    MSRecovered: null,
    unofficialUpdate: '',
    sheetsCount: null,
    sheetsUpdate: '',
    sheetsStateInfo: null,
    sheetsStateSuspects: null,
    sheetsStateRecovered: null,
    sheetsTotalSuspects: null,
    sheetsTotalRecovered: null,
    sheetsTotalDeaths: null,
    sheetsTotalTests: null,
    mapImageFileId: null,
    graphImageFileId: null,
    graphsUpdateTime: null,
    WMCount: null,
    WMDeaths: null,
    WMRecovered: null,
    WMUpdate: null,
    beds_supplies: {},
    socialDistancing: {
        graph: null,
        ranking: null
    },
    registry: {
        deaths: null,
        update: null
    }
}).write()

/** Last Cases Count from MS */
let lastMSCasesCount = db.get('count').value();
/** Last Deaths Count from MS */
let lastMSDeathsValue = db.get('deaths').value();
/** Last time for MSUpdate */
let lastMSUpdate = db.get('MSUpdate').value();
let lastMSRecovered = db.get('MSRecovered').value();
/** Last time for Wcota Update */
let lastWCotaUpdateTime = db.get('unofficialUpdate').value();
/** Last WCota state table data */
let lastWCotaStateInfo = db.get('unofficialStateInfo').value();
/** Last WCota Cases Count */
let lastWCotaCasesCount = db.get('unofficialCount').value();
/** Last WCota Deaths Count */
let lastWCotaDeathsCount = db.get('unofficialDeaths').value();

/** Last Cases Count from Sheets */
let lastSheetsCasesCount = db.get('sheetsCount').value()
/** Last time for Sheets update */
let lastSheetsUpdate = db.get('sheetsUpdate').value()
/** Last Sheets state table data */
let lastSheetsStateInfo = db.get('sheetsStateInfo').value();

let lastSheetsStateRecovered = db.get('sheetsStateRecovered').value();
let lastSheetsTotalRecovered = db.get('sheetsTotalRecovered').value();

let lastSheetsStateSuspects = db.get('sheetsStateSuspects').value();
let lastSheetsTotalSuspects = db.get('sheetsTotalSuspects').value();

let lastSheetsTotalDeaths = db.get('sheetsTotalDeaths').value();
let lastSheetsTotalTests = db.get('sheetsTotalTests').value();

/** Worldometer */
let lastWMCount = db.get('WMCount').value();
let lastWMDeaths = db.get('WMDeaths').value();
let lastWMRecovered = db.get('WMRecovered').value();
let lastWMUpdate = db.get('WMUpdate').value();

/** For Beds and Supplies */
let lastBedsObject = db.get('beds_supplies').value();

/** For Registry data */
let lastRegistryDeaths = db.get('registry.deaths').value();
let lastRegistryUpdate = db.get('registry.update').value();


/** Used for /debug command */
let lastDebug = {}
/** Used by admin to send bulk messages */
let admBulkMessages = {}

/* 
    Important! I froze my computer because I did not have this defined.
    Time to update in miliseconds.
 */
const timeToUpdate = 1000 * 60 * 15; // 15 minutes


/** Fetch latest cases information from Sheets, then update DB and variables */
const updateSheets = async function () {
    try {
        const {
            totalCount, stateInfo, date,
            totalSuspects, stateSuspects,
            totalRecovered, stateRecovered, totalDeaths, totalTests
        } = await (require('./google-drive')())

        lastSheetsCasesCount = totalCount;
        db.set('sheetsCount', lastSheetsCasesCount).write()
        lastSheetsUpdate = date;
        db.set('sheetsUpdate', lastSheetsUpdate).write()
        lastSheetsStateInfo = stateInfo;
        db.set('sheetsStateInfo', lastSheetsStateInfo).write();

        lastSheetsTotalTests = totalTests;
        db.set('sheetsTotalTests', lastSheetsTotalTests).write();

        lastSheetsTotalDeaths = totalDeaths;
        db.set('sheetsTotalDeaths', lastSheetsTotalDeaths).write();

        lastSheetsTotalSuspects = totalSuspects;
        db.set('sheetsTotalSuspects', lastSheetsTotalSuspects).write();

        lastSheetsStateSuspects = stateSuspects;
        db.set('sheetsStateSuspects', lastSheetsStateSuspects).write();

        lastSheetsTotalRecovered = totalRecovered;
        db.set('sheetsTotalRecovered', lastSheetsTotalRecovered).write();

        lastSheetsStateRecovered = stateRecovered;
        db.set('sheetsStateRecovered', lastSheetsStateRecovered).write();

        const item = {
            action: 'update sheets values',
            totalCount,
            stateInfo,
            date,
            totalSuspects,
            stateSuspects,
            totalRecovered,
            stateRecovered
        };
        /* TODO: Use transaction here */
        addToLog(item);
    } catch (e) {
        const item = {
            action: 'fail sheets update',
            error: e.toString()
        };
        /* TODO: Use transaction here */
        addToLog(item);
    }
}

/** Update MS Cases, Deaths, Update Time (from page). */
const updateMS = async function () {
    let driver = await new Builder().forBrowser('chrome').build();
    try {
        await driver.get('https://covid.saude.gov.br')
        let allCardElements = await driver.findElements(By.className('card-total'));
        await driver.wait(until.elementTextMatches(allCardElements[2], /CASOS CONFIRMADOS/), 45000);

        const element = allCardElements[2];
        console.log('element', (await (element.getAttribute('innerText'))))
        
        if ((await (element.getAttribute('innerText'))).indexOf('CASOS CONFIRMADOS') === -1) {
            throw new Error('Could not find confirmed cases')
        }

        /* TODO: */
        /* Need to rerun to avoid stale element error. Why? */
        allCardElements = await driver.findElements(By.className('card-total'))
        const newValue = (await (element.getAttribute('innerText'))).split('\n')[1].replace(/\./g, '');
        let newMSRecovered = (await (element.getAttribute('innerText'))).split('\n')[7].replace(/\./g, '');
        newMSRecovered = parseInt(newMSRecovered, 10);
        if (isNaN(newMSRecovered)) {
            throw new Error('Recovered count is not a number');
        }

        console.log('newMSRecovered', newMSRecovered)
        const eDeaths = allCardElements[3];

        if ((await (eDeaths.getAttribute('innerText'))).indexOf('ÓBITOS') === -1) {
            throw new Error('Could not find death count')
        }        

        const newDeaths = (await (eDeaths.getAttribute('innerText'))).split('\n')[1].replace(/\./g, '');
        console.log('Deaths', newDeaths)

        allCardElements = await driver.findElements(By.css('.lb-grey span'))
        const eMS = allCardElements[0];
        console.log('eMS', await eMS.getAttribute('innerText'))
        const newMS = (await (eMS.getAttribute('innerText'))).split(' ').join(' ') + `:00`;

        if (newValue === '') {
            throw new Error('Empty Value as result')
        }
        const item = {
            action: 'update value',
            count: newValue,
            deaths: newDeaths,
            recovered: newMSRecovered,
            updateTime: newMS
        };
        /* TODO: Use transaction here */
        addToLog(item);
        db.set('count', newValue).write();
        lastMSCasesCount = newValue;
        db.set('deaths', newDeaths).write();
        lastMSDeathsValue = newDeaths;
        db.set('MSRecovered', newMSRecovered).write();
        lastMSRecovered = newMSRecovered;
        db.set('MSUpdate', newMS).write()
        lastMSUpdate = newMS;
        await driver.quit();
        return newValue;
    } catch (e) {
        const item = {
            action: 'fail update',
            value: e.toString(),
        };
        addToLog(item)
        console.log('Failed to Update:', e)
        await driver.quit();
        return null;
    }
};

/** Update Worldometer Cases, Deaths, Recovered, Update Time (from page). */
const updateWorldometer = async function () {
    let driver = await new Builder().forBrowser('chrome').build();
    try {
        await driver.get('https://worldometers.info/coronavirus/country/brazil/')
        await driver.wait(until.elementLocated( By.className('maincounter-number')) )
        console.log('OK')
        let totalCasesCountElement = (await driver.findElements(By.className('maincounter-number')))[0];
        await driver.wait(until.elementTextMatches(totalCasesCountElement, /.+/), 45000);
        let casesCount = parseInt((await (totalCasesCountElement.getAttribute('innerText'))).replace(/,/g, ''), 10);
        console.log('casesCount', casesCount)

        let deathCountElement = (await driver.findElements(By.className('maincounter-number')))[1];
        await driver.wait(until.elementTextMatches(deathCountElement, /.+/), 45000);
        let deathCount = parseInt((await (deathCountElement.getAttribute('innerText'))).replace(/,/g, ''), 10);
        console.log('deathCount', deathCount)      
        
        let recoveredCountElement = (await driver.findElements(By.className('maincounter-number')))[2];
        await driver.wait(until.elementTextMatches(recoveredCountElement, /.+/), 45000);
        let recoveredCount = parseInt((await (recoveredCountElement.getAttribute('innerText'))).replace(/,/g, ''), 10);
        console.log('recoveredCount', recoveredCount)      
        
        let updateTimeElement = await driver.findElement(By.css('#page-top~div'));
        await driver.wait(until.elementTextMatches(updateTimeElement, /.+/), 45000);
        let updateTime = new Date(await (updateTimeElement.getAttribute('innerText'))).toLocaleString('pt-br');
        console.log('updateTime', updateTime)      


        if (Number.isNaN(casesCount) || Number.isNaN(deathCount) || Number.isNaN(recoveredCount) ) {
            throw new Error('NaN as result')
        }

        const item = {
            action: 'update Worldometer values',
            count: casesCount,
            deaths: deathCount,
            recovered: recoveredCount,
            updateTime
        };
        /* TODO: Use transaction here */
        addToLog(item);

        db.set('WMCount', casesCount).write();
        lastWMCount = casesCount;
        db.set('WMDeaths', deathCount).write();
        lastWMDeaths = deathCount;
        db.set('WMRecovered', recoveredCount).write()
        lastWMRecovered = recoveredCount;
        db.set('WMUpdate', updateTime).write()
        lastWMUpdate = updateTime;
        await driver.quit();
        /* TODO: Is this necessary? */
        return lastWMCount;
    } catch (e) {
        const item = {
            action: 'fail update',
            value: e.toString(),
        };
        addToLog(item)
        console.log('Failed to Update:', e)
        await driver.quit();
        return null;
    }
};

/** Update WCota Cases, Deaths, StateInfo and Count */
const updateWCota = async function () {
    try {
        /* TODO: */
        const { newValue, date, deaths: udeaths, stateInfo } = await require('./unofficial')();
        if (newValue === '') {
            throw new Error('Empty Value as result')
        }
        const item = {
            action: 'update WCota values',
            value: newValue,
            date
        };
        /* TODO: Use transaction here */
        addToLog(item);
        db.set('unofficialCount', newValue).write();
        lastWCotaCasesCount = newValue;
        db.set('unofficialUpdate', date).write();
        lastWCotaUpdateTime = date;
        db.set('unofficialDeaths', udeaths).write();
        lastWCotaDeathsCount = udeaths;
        db.set('unofficialStateInfo', stateInfo).write();
        lastWCotaStateInfo = stateInfo;

        return newValue;
    } catch (e) {
        const item = {
            action: 'fail update WCota',
            value: e.toString(),
        };
        addToLog(item)
        return null;
    }
};

const updateRegistry = async function () {
    try {
        let result = await (require('./registry')())
        if (result === null) {
            throw new Error('Empty value as return')
        }
        lastRegistryDeaths = result.total;
        db.set('registry.deaths', lastRegistryDeaths).write();

        lastRegistryUpdate = result.lastUpdate;
        db.set('registry.update', lastRegistryUpdate).write();
        console.log('REGISTRY', lastRegistryDeaths, lastRegistryUpdate)

        
    } catch (e) {
        addToLog({
            action: 'fail registry update',
            error: e.toString()
        })
    }
}

/* TODO: Check one by one user */
const maybeSendUpdates = async () => {

    /* TODO: Reenable once MS is working */
    await updateMS();
    await updateWCota();
    await updateSheets();
    await updateWorldometer();
    await updateRegistry();
    
    try {
        let result = await (require('./supplies')())

        if (result === null) {
            throw new Error('Returned null as result')
        }

        db.set('beds_supplies', result).write();
        lastBedsObject = result;

    } catch (e) {
        addToLog({
            action: 'fail to update beds',
            error: e.toString()
        })
    }

    /* Filtering first in order to avoid useless timeouts */
    const availableChats = db.get('chats').filter((chat) => shouldMessageChatId(chat.id));
    const outdatedChats = availableChats.filter((chat) => chatNumbersAreSame(chat.id) === false).value();

    console.log({
        total: db.get('chats').value().length,
        availableNow: availableChats.value().length,
        availableAndOutdated: outdatedChats.length
    })

    sendUpdates(outdatedChats);
}

/** This handy function will add an object to log and console.log it */
const addToLog = (obj) => {
    console.log(obj);
    let a = {
        ...obj,
        _time: new Date().toUTCString()
    };
    /* This was a the performance bottleneck at first.
    Instead of saving in the db, we use a append-only method to a plain file */
    fs.appendFileSync('log.log', JSON.stringify(a) + `\n`);
}

/** Send updates to the chat users.
 * Replacement: optional. if not provided will be the whole list of chats
 * customMethod: optional. If not provided will be "sendCurrentCount". This method is the "action" that will be fired (send message, photos, etc)
 */
const sendUpdates = async (replacement, customMethod) => {
    let chats = replacement || db.get('chats').value();

    /** Total number of requests */
    let total = chats.length;

    /** For benchmarking */
    let startBenchmark = Date.now();

    /** Requests still to be made */
    let missingConnections = total;

    /** Set with all error strings. Useful for debugging */
    let errors = new Set();

    /** Target number of requests per second. Cannot exceed 30 */
    let requestsPerSecond = 23;
    let successRequests = 0;
    let erroredRequests = 0;
    let stoppedUsers = 0;

    /** Requests that have been asked to skip */
    let skipped = 0;

    /** Indexer */
    let i = 0;

    /* 
    Performance optimization: Only save every n seconds
    This should speed up bulk messaging */
    let writeInterval = 3000;

    let saveDBInterval = setInterval(() => {
        console.log('SAVING DB');
        db.write();
    }, writeInterval)    

    /* Start the calls and get a reference to interval.
    This method will parallelize the Telegram API server requests */
    let ref = setInterval(() => {
        if (i < total) {
            const callbackFactory = (p, q, r) => (worked) => {
                switch (worked) {
                    case true:
                        successRequests++;
                        break;
                    case 'skip':
                        skipped++;
                        break;
                    default:
                        erroredRequests++;
                        errors.add(worked);
                        break;
                }
                console.log('finished', p, q, r);
                missingConnections--;
                console.log('missing', missingConnections);

                /* Once all requests have been made (succeeded or failed, doesnt matter) */
                if (missingConnections === 0) {
                    let seconds = (Date.now() - startBenchmark) / 1000;
                    let summary = {
                        action: 'Finish Bulk Send',
                        seconds,
                        success: successRequests,
                        errorCount: erroredRequests,
                        skipped,
                        total,
                        opsSecond: total / seconds,
                        requestsPerSecond,
                        stoppedUsers,
                        errors: [...errors]
                    };
                    addToLog(summary);
                    lastDebug = summary;

                    /* Erase unreachable users/groups. Bye! */

                    const unreachable = db.get('chats').filter(i => i.wipe >= 2).value();
                    db.get('chats').remove(i => i.wipe >= 2).write();

                    addToLog({
                        action: 'Erase subscriptions',
                        items: unreachable
                    })
                    /* TODO: Merge code with stop */
                }
            }
            /* TODO: How can chats[i] not exist? Cancelled? */
            console.log('firing', i, total, chats[i] && chats[i].id)
            /* TODO: Not enough in some cases? */
            if (chats[i] && chats[i].id) {
                maybeSendCurrentCount(chats[i].id, customMethod).then(
                    /* TODO: Analyze */
                    callbackFactory(i, total, chats[i] && chats[i].id)
                )
            } else {
                addToLog({
                    action: 'Report Inexistent Chat Item',
                    i
                })
                /* TODO: Use callback factory here, low prob of bug */
                stoppedUsers++;
                missingConnections--;
            }

            i++;
        } else {
            addToLog({
                action: 'Clear Request Manager Interval'
            })
            clearInterval(ref)
            setTimeout(() => {
                clearInterval(saveDBInterval)
            }, writeInterval)
            addToLog({
                action: 'Clear SaveDB interval'
            })            
        }
    }, 1000 / requestsPerSecond);

}

/** Check whether chatId can receive a notification in the moment */
const hourCheck = (chatId, log = false) => {
    const obj = db.get('chats').find({ id: chatId }).value()
    let startHour = obj.startHour || 0;
    let endHour = obj.endHour || 24;
    let currHour = new Date().getHours();
    let passHourTest = (startHour <= currHour) && (currHour < endHour);
    if (log === true) {
        addToLog({
            action: 'checkHourRange',
            startHour,
            endHour,
            currHour,
            passHourTest
        })
    }
    return passHourTest;
}

/** Check if chatId can receive notification in the moment,
 * based on the minimum time for notification.
 */
const intervalCheck = (chatId, log = false) => {
    const obj = db.get('chats').find({ id: chatId }).value();
    let interval = obj.interval;
    let toAdd = (interval || 0) * 60 * 1000; /* min * sec (60) * millisec (1000) */
    let lastSent = obj.lastSent;
    let lastSentTime = lastSent ? new Date(lastSent).getTime() : 0;
    let nextTime = lastSentTime + toAdd;
    let currTime = new Date().getTime();
    if (log === true) {
        addToLog({
            action: 'checkIntervalRange',
            nextTime,
            currTime,
            toAdd
        })
    }
    return (currTime > nextTime);
}

/** Check if chatId can receive message in the moment */
const shouldMessageChatId = (chatId, log = false) => intervalCheck(chatId, log) && hourCheck(chatId, log);

/** Only sends a notification in case chatId is "available" at the time */
const maybeSendCurrentCount = async (chatId, customMethod) => {
    if (shouldMessageChatId(chatId, true)) {
        if (customMethod) {
            console.log('Using Custom Method', customMethod)
        }
        /* Providing force = false to avoid re-sending to those with same values */
        /* Providing saveDB = false to avoid slowing down during bulk messaging */
        let returnOfFn = await ((customMethod || sendCurrentCount(false, false))(chatId));
        return (returnOfFn === false) ? 'skip' : returnOfFn;
    } else {
        addToLog({
            action: 'Skip Send Count',
            chatId
        })
        /* TODO: Use symbol */
        return 'skip';
    }
}

/* Kickoff initial and periodic update checks */
maybeSendUpdates();
setInterval(maybeSendUpdates, timeToUpdate)

const updateMembersCount = async () => {
    const allChats = db.get('chats').filter((chat) => (chat.id < 0) || ('' + chat.id).startsWith(`@`)).value();
let total = allChats.length
    allChats.forEach((chat) => {
        setTimeout(async () => {
            console.log('fire for', chat.id, total)
            let membersCount = await bot.getChatMembersCount(chat.id);
            db.get('chats').find({ id: chat.id }).assign({
                membersCount
            }).write() //There is a value/write in the end of the function too
            total = total - 1;
            console.log('wrote for', chat.id, total)
        }, 1000 / 10)
    })
}

// updateMembersCount();



/* Instantiate the bot and set the commands */
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, async (msg, match) => {
    const chatId = msg.chat.id;

    const startChatAction = {
        action: 'chat id receive start',
        chatId
    }
    addToLog(startChatAction);

    const chatObj = db.get(`chats`).find({ id: chatId }).value();

    if (chatObj === undefined) {

        addToLog({
            action: 'New subscription',
            chatId,
        })

        let startSubscription = strings.startMsg;
        await bot.sendMessage(chatId, startSubscription, { parse_mode: 'HTML' });
        addToLog({
            action: 'send message',
            message: startSubscription,
            chatId
        })

        /* Insert new chatId to Chats array in database */
        db.get('chats').push({
            id: chatId,
            lastValue: lastMSCasesCount,
            lastUnofficial: lastSheetsCasesCount,
            lastMSDeaths: lastMSDeathsValue,
            lastSent: new Date().toString(),
            lastSuspects: lastSheetsTotalSuspects,
            wipe: 0,
            lastRecovered: lastSheetsTotalRecovered,
            lastWMCount,
            lastWMDeaths,
            lastWMRecovered,
            lastUnofficialDeaths: lastSheetsTotalDeaths,
            lastUnofficialTests: lastSheetsTotalTests,
            lastRegistryDeaths
        }).write()

        await sendCurrentCount(true)(chatId);

    } else {
        addToLog({
            action: 'Existent Subscription, no changes',
            chatId,
        })
        await sendCurrentCount(true, false)(chatId);
        db.write();
    }
});

bot.onText(/\/stop/, async (msg, match) => {
    const chatId = msg.chat.id;
    const stopChatAction = {
        action: 'chat id receive stop',
        chatId
    }
    addToLog(stopChatAction);

    const chatObj = db.get(`chats`).find({ id: chatId }).value();
    if (chatObj !== undefined) {
        addToLog({
            action: 'Cancel subscription',
            chatId
        })

        db.get(`chats`).remove((i) => i.id === chatId).write();
        let cancelSubscription = strings.stopMsg;
        await bot.sendMessage(chatId, cancelSubscription, { parse_mode: 'HTML' });
        addToLog({
            action: 'send message',
            message: cancelSubscription,
            chatId
        })

    } else {
        addToLog({
            action: 'Cannot Stop Inexistent Subscription',
            chatId
        })
    }
})

const fireBedsAndSupplies = async (chatId) => {
    await bot.sendMessage(chatId, strings.bedsAndSupplies(lastBedsObject), {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{text: 'Fonte', url: 'https://covid-insumos.saude.gov.br/paineis/insumos/painel.php'}],
            ]
        }
    });
}

bot.onText(/\/leitos_insumos/, async (msg, match) => {
    const chatId = msg.chat.id;
    fireBedsAndSupplies(chatId)
})

bot.onText(/\/intervalo (\d{1,4})/, async (msg, match) => {

    const chatId = msg.chat.id;
    const chatObj = db.get('chats').find({ id: chatId }).value();

    if (chatObj === undefined) {
        let msg = `Voce precisa estar inscrito para usar este comando.`
        await bot.sendMessage(chatId, msg);
        addToLog({
            action: 'send message',
            chatId,
            message: msg
        })
        return;
    }

    let timeUnsafe = match[1];
    let time;
    try {
        time = parseInt(timeUnsafe)

        let configMessage;
        if (time !== 0) {
            configMessage = `Configurando intervalo mínimo para <b>${time} minutos.</b>`;
        } else {
            configMessage = `Removendo intervalo mínimo de notificacao.`
        }

        await bot.sendMessage(chatId, configMessage, { parse_mode: 'HTML' });
        addToLog({
            action: 'send message',
            chatId,
            configMessage
        })

        if (time !== 0) {
            /* Using value to batch with next change (addToLog will write) */
            db.get('chats').find({ id: chatId }).assign({
                interval: time
            }).value();
            addToLog({
                action: 'Add interval to chatId',
                chatId,
                time
            })
        } else {
            /* Using value to batch with next change (addToLog will write) */
            db.get('chats').find({ id: chatId }).unset('interval').value();
            addToLog({
                action: 'Remove interval from chatId',
                chatId
            })
        }

        await sendCurrentCount(true)(chatId);

    } catch (e) {
        let errMessage = 'Nao entendi o numero que voce digitou. Operacao cancelada.';
        await bot.sendMessage(chatId, errMessage);
        addToLog({
            action: 'send message',
            chatId,
            errMessage
        })
    }

})


bot.onText(/\/ajuda/, async (msg, match) => {
    const chatId = msg.chat.id;

    let resultMsg = strings.helpMsg;
    await bot.sendMessage(chatId, resultMsg, { parse_mode: 'HTML' });
    addToLog({
        action: 'send message',
        chatId,
        message: resultMsg
    })
})

bot.onText(/\/usuarios/, async (msg, match) => {
    const chatId = msg.chat.id;
    const unreachable = db.get('chats').filter(i => i.wipe > 0).value().length;
    const chatsLength = db.get('chats').value().length;
    const groupsLength = db.get('chats').filter(i => i.id < 0).value().length;
    const peopleLength = db.get('chats').filter(i => i.id > 0).value().length;
    const channelsLength = db.get('chats').filter(i => ('' + i.id).startsWith('@')).value().length;
    let membersCount = 0;
    let maxCount = db.get('chats').filter(i => i.membersCount > 0).maxBy('membersCount').value().membersCount;
    db.get('chats').filter(i => i.membersCount > 0).forEach(i =>  {
        membersCount = membersCount + i.membersCount
    }).value();


    let resultMsg = strings.usersMsg(chatsLength, unreachable, {
        channels: channelsLength,
        groups: groupsLength,
        people: peopleLength,
        membersCount,
        maxCount
    });
    await bot.sendMessage(chatId, resultMsg);
    addToLog({
        action: 'send message',
        chatId,
        message: resultMsg
    })
})

const path = require('path');

bot.onText(/\/adm_update_graphs/, async (msg, match) => {
    addToLog({
        action: 'Receive request adm_update_graphs',
        msg
    })
    /* TODO: Abstract auth code */
    const chatId = msg.chat.id;

    if (!process.env.ADMIN_ID) {
        bot.sendMessage(chatId, strings.noAdminConfigured, { parse_mode: 'HTML' })
        addToLog({
            action: 'No Admin Configured',
            chatId
        })
        return;
    }

    const adminId = parseInt(process.env.ADMIN_ID);

    if (chatId !== adminId) {
        bot.sendMessage(chatId, strings.notAuthorized, { parse_mode: 'HTML' })
        addToLog({
            action: 'Not Authorized',
            chatId
        })
        return;
    }

    /* Update the graph and map */
    const lastUpdateTime = await (require('./graphs.js')());
    db.set('graphsUpdateTime', lastUpdateTime).write();

    let graphPath = path.join(__dirname, './graph.png');
    const answer = await bot.sendPhoto(chatId, graphPath, {
        caption: strings.graphCaption(db.get('graphsUpdateTime').value()),
        parse_mode: 'HTML'
    })
    let graphFileId = answer.photo[0].file_id;
    db.set('graphImageFileId', graphFileId).write();


    console.log("RETURN ID", answer.photo[0].file_id)

    let mapPath = path.join(__dirname, './map.png');
    const answer2 = await bot.sendPhoto(chatId, mapPath, {
        caption: strings.mapCaption(db.get('graphsUpdateTime').value()),
        parse_mode: 'HTML'
    })
    let mapFileId = answer2.photo[0].file_id;
    db.set('mapImageFileId', mapFileId).write();

    /* social distancing graphs **/
    let sd = await (require('./inloco-graphs')());

    let sdGraphPath = path.join(__dirname, './inloco/visao.png')
    const answerSd = await bot.sendPhoto(chatId, sdGraphPath, {
        caption: strings.sdGraphCaption(db.get('graphsUpdateTime').value()),
        parse_mode: 'HTML'
    })    
    let sdGraphId = answerSd.photo[0].file_id;
    db.set('socialDistancing.graph', sdGraphId).write();


    let sdRankingPath = path.join(__dirname, './inloco/ranking.png')
    const answerSd2 = await bot.sendPhoto(chatId, sdRankingPath, {
        caption: strings.sdRankingCaption(db.get('graphsUpdateTime').value()),
        parse_mode: 'HTML'
    })    
    let sdRankingId = answerSd2.photo[0].file_id;
    db.set('socialDistancing.ranking', sdRankingId).write();    


    bot.sendMessage(chatId, 
        `graphFileId: ${graphFileId}\n mapFileId: ${mapFileId}\n sdGraphId: ${sdGraphId}\n sdRankingId: ${sdRankingId}`)

})

bot.onText(/\/adm_send_message/, async (msg, match) => {

    addToLog({
        action: 'Receive request adm_send_message',
        msg
    })

    const chatId = msg.chat.id;

    if (!process.env.ADMIN_ID) {
        bot.sendMessage(chatId, strings.noAdminConfigured, { parse_mode: 'HTML' })
        addToLog({
            action: 'No Admin Configured',
            chatId
        })
        return;
    }

    const adminId = parseInt(process.env.ADMIN_ID);

    if (chatId !== adminId) {
        bot.sendMessage(chatId, strings.notAuthorized, { parse_mode: 'HTML' })
        addToLog({
            action: 'Not Authorized',
            chatId
        })
        return;
    }

    try {


        const ask = await bot.sendMessage(chatId, 'Digite a mensagem a ser enviada. 45 min restantes.', {
            reply_markup: {
                force_reply: true
            }
        });

        const listener = bot.onReplyToMessage(chatId, ask.message_id, async (result) => {
            bot.removeReplyListener(listener)

            const preview = await bot.sendMessage(chatId, result.text, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Confirmar envio', callback_data: 'confirm_bulk_send' }
                        ]
                    ]
                }
            })

            admBulkMessages[preview.message_id] = result.text;

        })

        setTimeout(() => {
            bot.removeReplyListener(listener)
        }, 1000 * 60 * 45) //45 minutes to auto-cancel.

    } catch (e) {
        addToLog({
            action: 'Error',
            error: e.toString()
        })
        return e.toString()
    }
})

const reapplyEntities = (string, entities) => {

    let newStr = string;
    let extraOffset = 0;

    entities.filter(i => i.type === 'bold').forEach(i => {
        newStr = newStr.substring(0, i.offset+ extraOffset) + '<b>' + newStr.substring(i.offset + extraOffset, i.offset + i.length+ extraOffset) + '</b>' + newStr.substring(i.offset + i.length+ extraOffset)
        extraOffset = extraOffset + 7;
    })

    return newStr;
}

bot.on('callback_query', async (query) => {
    addToLog({
        action: 'Receive Callback Query',
        query
    })

    if (query.data === 'confirm_bulk_send') {
        if (!process.env.ADMIN_ID) {
            bot.sendMessage(query.from.id, strings.noAdminConfigured, { parse_mode: 'HTML' })
            return;
        }
        const adminId = parseInt(process.env.ADMIN_ID);

        if (query.from.id !== adminId) {
            bot.sendMessage(chatId, strings.notAuthorized, { parse_mode: 'HTML' })
            return;
        }

        try {
            const rawText = admBulkMessages[query.message.message_id];

            /* Remove confirm button */
            await bot.editMessageReplyMarkup({}, { chat_id: query.message.chat.id, message_id: query.message.message_id })

            /* remove from admBulkMessages */
            delete admBulkMessages[query.message.message_id];

            /* Bulk code should go here */
            const customMethod = async (cid) => {
                try {

                    await bot.sendMessage(cid, rawText, {
                        parse_mode: 'HTML'
                    })

                    /* Record log */
                    addToLog({
                        action: 'send message',
                        chatId: cid,
                        message: rawText
                    })

                    return true;
                } catch (e) {
                    addToLog({
                        action: 'failed to send message',
                        error: e.toString(),
                        chatId: cid,
                        message: rawText
                    })
                    return e.toString();
                }

            }

            sendUpdates(null, customMethod)

        } catch (e) {
            console.log('bot error', e)
        } finally {
            await bot.answerCallbackQuery(query.id)
        }

        /* TODO: Use switch */
    }
    else if ((query.data === 'change_table_deaths') || (query.data === 'change_table_cases') || (query.data === 'change_table_suspects')) {
        let resolvedKeyboard;

        switch(query.data) {
            case 'change_table_cases':
            resolvedKeyboard = [
                [
                    { text: 'Ver Menos', callback_data: 'cases_from_0' },
                ],
                [
                    { text: '⚬ Casos ⚬', callback_data: 'do_nothing' },
                    { text: 'Óbitos', callback_data: 'change_table_deaths' },                    
                    { text: 'Suspeitos', callback_data: 'change_table_suspects'}
                ]
            ]
            break;
            case 'change_table_deaths':
            resolvedKeyboard = [
                [
                    { text: 'Ver Menos', callback_data: 'deaths_from_0' }
                ], [
                    { text: 'Casos', callback_data: 'change_table_cases' },
                    { text: '⚬ Óbitos ⚬', callback_data: 'do_nothing' },                    
                    { text: 'Suspeitos', callback_data: 'change_table_suspects'}
                ]
            ]
            break;
            case 'change_table_suspects':
            resolvedKeyboard = [
                [
                    { text: 'Ver Menos', callback_data: 'suspects_from_0' }
                ],
                [
                    { text: 'Casos', callback_data: 'change_table_cases' },
                    { text: 'Óbitos', callback_data: 'change_table_deaths' },                    
                    { text: '⚬ Suspeitos ⚬', callback_data: 'do_nothing'}
                ]
            ]
            break;            
        }

        let msg;
        switch(query.data) {
            case 'change_table_cases':
                msg = getStateTableCases();
                break;
            case 'change_table_deaths':
                msg = getStateTableDeaths();
                break;
            case 'change_table_suspects':
                msg = getStateTableSuspects();
                break;
        }

        await bot.editMessageText(msg, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: resolvedKeyboard
            },
            chat_id: query.message.chat.id, message_id: query.message.message_id
        })

        await bot.answerCallbackQuery(query.id)


    }
    else if (query.data.startsWith('cases_from')) {
        /* TODO: Filter for malicious */
        let startingIndex = Math.max(0, Math.min(parseInt(query.data.split('_')[2]), 23));
        const resolvedKeyboard = [
            [
                { text: 'Ver Todos', callback_data: 'change_table_cases' },
                startingIndex === 0 ? { text: '⚬', callback_data: 'do_nothing' } : { text: '⬆️', callback_data: 'cases_from_' + (startingIndex - 5) },
                startingIndex === 23 ? { text: '⚬', callback_data: 'do_nothing' } : { text: '⬇️', callback_data: 'cases_from_' + (startingIndex + 5) },
            ],
            [
                { text: '⚬ Casos ⚬', callback_data: 'do_nothing' },
                { text: 'Óbitos', callback_data: 'deaths_from_0' },
                { text: 'Suspeitos', callback_data: 'suspects_from_0'}
            ]
        ]
        await bot.editMessageText(getStateTableCases(startingIndex, startingIndex + 4), {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: resolvedKeyboard
            },
            chat_id: query.message.chat.id, message_id: query.message.message_id
        })
        await bot.answerCallbackQuery(query.id)
    }
    else if (query.data.startsWith('deaths_from')) {
        /* TODO: Filter for malicious */
        let startingIndex = Math.max(0, Math.min(parseInt(query.data.split('_')[2]), 23));
        const resolvedKeyboard = [
            [
                { text: 'Ver Todos', callback_data: 'change_table_deaths' },
                startingIndex === 0 ? { text: '⚬', callback_data: 'do_nothing' } : { text: '⬆️', callback_data: 'deaths_from_' + (startingIndex - 5) },
                startingIndex === 23 ? { text: '⚬', callback_data: 'do_nothing' } : { text: '⬇️', callback_data: 'deaths_from_' + (startingIndex + 5) },
            ],
            [
                { text: 'Casos', callback_data: 'cases_from_0' },
                { text: '⚬ Óbitos ⚬', callback_data: 'do_nothing' },
                { text: 'Suspeitos', callback_data: 'suspects_from_0'}
            ]
        ]
        await bot.editMessageText(getStateTableDeaths(startingIndex, startingIndex + 4), {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: resolvedKeyboard
            },
            chat_id: query.message.chat.id, message_id: query.message.message_id
        })
        await bot.answerCallbackQuery(query.id)
    }
    else if (query.data.startsWith('suspects_from')) {
        /* TODO: Filter for malicious */
        let startingIndex = Math.max(0, Math.min(parseInt(query.data.split('_')[2]), 23));
        const resolvedKeyboard = [
            [
                { text: 'Ver Todos', callback_data: 'change_table_suspects' },
                startingIndex === 0 ? { text: '⚬', callback_data: 'do_nothing' } : { text: '⬆️', callback_data: 'suspects_from_' + (startingIndex - 5) },
                startingIndex === 23 ? { text: '⚬', callback_data: 'do_nothing' } : { text: '⬇️', callback_data: 'suspects_from_' + (startingIndex + 5) },
            ], 
            [
                { text: 'Casos', callback_data: 'cases_from_0' },
                { text: 'Óbitos', callback_data: 'deaths_from_0' },
                { text: '⚬ Suspeitos ⚬', callback_data: 'do_nothing'}
            ]
        ]
        await bot.editMessageText(getStateTableSuspects(startingIndex, startingIndex + 4), {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: resolvedKeyboard
            },
            chat_id: query.message.chat.id, message_id: query.message.message_id
        })
        await bot.answerCallbackQuery(query.id)
    }    
    else if (query.data === 'change_map') {
        await bot.editMessageMedia({
            type: 'photo',
            media: db.get('mapImageFileId').value(),
            caption: strings.mapCaption(db.get('graphsUpdateTime').value()),
            parse_mode: 'HTML'
        }, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: 'Gráfico', callback_data: 'change_graph'},
                        {text: '⚬ Mapa ⚬', callback_data: 'do_nothing'}
                    ],
                    [
                        {text: 'Gráfico Isolamento', callback_data: 'change_sd_graph'},
                        {text: 'Ranking Isolamento', callback_data: 'change_sd_ranking'}
                    ]                    
                ]
            },
            chat_id: query.message.chat.id, message_id: query.message.message_id
        })
        await bot.answerCallbackQuery(query.id)
    }
    else if (query.data === 'change_graph') {
        await bot.editMessageMedia({
            type: 'photo',
            media: db.get('graphImageFileId').value(),
            caption: strings.graphCaption(db.get('graphsUpdateTime').value()),
            parse_mode: 'HTML'
        }, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: '⚬ Gráfico ⚬', callback_data: 'do_nothing'},
                        {text: 'Mapa', callback_data: 'change_map'}
                    ],
                    [
                        {text: 'Gráfico Isolamento', callback_data: 'change_sd_graph'},
                        {text: 'Ranking Isolamento', callback_data: 'change_sd_ranking'}
                    ]                    
                ]
            },
            chat_id: query.message.chat.id, message_id: query.message.message_id
        })
        await bot.answerCallbackQuery(query.id)
    }    
    else if (query.data === 'change_sd_graph') {
        await bot.editMessageMedia({
            type: 'photo',
            media: db.get('socialDistancing.graph').value(),
            caption: strings.sdGraphCaption(db.get('graphsUpdateTime').value()),
            parse_mode: 'HTML'
        }, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: 'Gráfico', callback_data: 'change_graph'},
                        {text: 'Mapa', callback_data: 'change_map'}
                    ],
                    [
                        {text: '⚬ Gráfico Isolamento ⚬', callback_data: 'do_nothing'},
                        {text: 'Ranking Isolamento', callback_data: 'change_sd_ranking'}
                    ]                    
                ]
            },
            chat_id: query.message.chat.id, message_id: query.message.message_id
        })
        await bot.answerCallbackQuery(query.id)
    }  
    else if (query.data === 'change_sd_ranking') {
        await bot.editMessageMedia({
            type: 'photo',
            media: db.get('socialDistancing.ranking').value(),
            caption: strings.sdRankingCaption(db.get('graphsUpdateTime').value()),
            parse_mode: 'HTML'
        }, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: 'Gráfico', callback_data: 'change_graph'},
                        {text: 'Mapa', callback_data: 'change_map'}
                    ],
                    [
                        {text: 'Gráfico Isolamento', callback_data: 'change_sd_graph'},
                        {text: '⚬ Ranking Isolamento ⚬', callback_data: 'do_nothing'}
                    ]                    
                ]
            },
            chat_id: query.message.chat.id, message_id: query.message.message_id
        })
        await bot.answerCallbackQuery(query.id)
    }            
    else if (query.data === 'fire_states') {
        await fireStates(query.message.chat.id);
        await bot.answerCallbackQuery(query.id);
    }
    else if (query.data === 'fire_graphs') {
        await fireGraphs(query.message.chat.id);
        await bot.answerCallbackQuery(query.id);
    }
    else if (query.data.startsWith('smo0_')) {
        let stamps = query.data.split('smo0_')[1].split('_');
        let lastSheetsUpdate1 = new Date(parseInt(stamps[0] * 1000, 10)).toLocaleString('pt-br')
        let lastMSUpdate1 = new Date(parseInt(stamps[1] * 1000, 10)).toLocaleString('pt-br')
        let lastWMUpdate1 = new Date(parseInt(stamps[2] * 1000, 10)).toLocaleString('pt-br')
        let lastRegistryUpdate1 = new Date(parseInt(stamps[3] * 1000, 10)).toLocaleString('pt-br')
        let appendToMessage = `<b>Atualizado Em:</b>        
▪: ${lastSheetsUpdate1}
▫: ${lastMSUpdate1} 
🔅: ${lastWMUpdate1}
▪: ${lastRegistryUpdate1}

`
        console.log('ENTITIES', query.message.entities)
        let msgWithEntities = reapplyEntities(query.message.text, query.message.entities)

        let newMessage = msgWithEntities.split('🔄')[0]+ appendToMessage + '🔄' + msgWithEntities.split('🔄')[1];
        await bot.editMessageText(newMessage, { 
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: '🧩 Estados', callback_data: 'fire_states'},
                        {text: '➖ Menos', callback_data: 'slo0_' + query.data.split('smo0_')[1]}
                    ],[
                        {text: '📈 Gráficos', callback_data: 'fire_graphs'},
                        {text: '🏥 Leitos/Insumos', callback_data: 'fire_beds_supplies'},
                    ],
                    [
                        {text: '📍 Municípios', url: 'https://labs.wesleycota.com/sarscov2/br/'},
                        {text: '🦠 Notícias', url: 'https://twitter.com/coronavirusbra1'},
                        {text: '🌎 Mundo', url: 'https://www.worldometers.info/coronavirus/'}
                    ]
                ]
            },
            chat_id: query.message.chat.id, 
            message_id: query.message.message_id,
        })
        await bot.answerCallbackQuery(query.id)

    }
    else if (query.data.startsWith('slo0_')) {
        let msgWithEntities = reapplyEntities(query.message.text, query.message.entities)

        let resultMsg = msgWithEntities.split('<b>Atualizado Em:</b>')[0] + '🔄' + msgWithEntities.split('🔄')[1];
        await bot.editMessageText( resultMsg, { 
            chat_id: query.message.chat.id, 
            message_id: query.message.message_id,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: '🧩 Estados', callback_data: 'fire_states'},
                        {text: '➕ Mais', callback_data: 'smo0_'+query.data.split('slo0_')[1]}
                    ],
                    [
                        {text: '📈 Gráficos', callback_data: 'fire_graphs'},
                        {text: '🏥 Leitos/Insumos', callback_data: 'fire_beds_supplies'},                        
                    ]
                ]
            }
        })
        await bot.answerCallbackQuery(query.id)

    }    
    else if (query.data === 'fire_beds_supplies') {
        await fireBedsAndSupplies(query.message.chat.id);
        await bot.answerCallbackQuery(query.id)
    }
    else if (query.data === 'do_nothing') {
        await bot.answerCallbackQuery(query.id)
    }

})


bot.onText(/\/add_canal (.+)/, async (msg, match) => {

    const chatId = msg.chat.id;
    const channel = (match[1][0] === '@') ? match[1] : `@` + match[1];

    bot.sendMessage(chatId, strings.addChannelAttempt({ channel }), { parse_mode: 'HTML' })

    try {

        if (db.get('chats').find({ id: channel }).value()) {
            bot.sendMessage(chatId, strings.channelAlreadySubscribed({ channel }), { parse_mode: 'HTML' });
            return;
        }

        await bot.sendMessage(channel, strings.activateChannel({ channel }), { parse_mode: 'HTML' })

        db.get('chats').push({
            id: channel,
            lastValue: lastMSCasesCount,
            lastUnofficial: lastSheetsCasesCount,
            lastSent: new Date().toString(),
            wipe: 0
        }).write()

        await sendCurrentCount(true)(channel);

        await bot.sendMessage(chatId, strings.channelSubscribed({ channel }), { parse_mode: 'HTML' })

    } catch (e) {
        bot.sendMessage(chatId, channelConnectError({ channel }), { parse_mode: 'HTML' })
    }

})


bot.onText(/\/debug/, async (msg, match) => {
    const chatId = msg.chat.id;
    const os = require('os');

    const resultMsg = `<pre><code class="language-javascript">` + JSON.stringify({
        memory: process.memoryUsage(),
        osMemory: {
            freemem: os.freemem(),
            totalmem: os.totalmem()
        },
        ...lastDebug,
        lastSheetsCasesCount,
        lastSheetsUpdate,
        lastWMCount,
        lastWMDeaths,
        lastWMRecovered,
        lastRegistryDeaths,
        lastRegistryUpdate,
        lastMSRecovered,
        uptime: require('perf_hooks').performance.now()
    }, null, 2) + `</code></pre>`;

    await bot.sendMessage(chatId, resultMsg, { parse_mode: 'HTML' })
    addToLog({
        action: 'send message',
        chatId,
        message: resultMsg
    })
})

bot.onText(/\/faq/, async (msg, match) => {
    const chatId = msg.chat.id;

    const resultMsg = strings.faq;

    await bot.sendMessage(chatId, resultMsg, { parse_mode: 'HTML' })
    addToLog({
        action: 'send message',
        chatId,
        message: resultMsg
    })
})

const fireGraphs = async (chatId) => {
    addToLog({
        action: 'Request graphs',
        chatId
    })

    await bot.sendPhoto(chatId, db.get('graphImageFileId').value(), {
        caption: strings.graphCaption(db.get('graphsUpdateTime').value()),
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    {text: '⚬ Gráfico ⚬', callback_data: 'do_nothing'},
                    {text: 'Mapa', callback_data: 'change_map'}
                ],
                [
                    {text: 'Gráfico Isolamento', callback_data: 'change_sd_graph'},
                    {text: 'Ranking Isolamento', callback_data: 'change_sd_ranking'}
                ]                       
            ]
        }
    })
}

bot.onText(/\/graficos/, async (msg, match) => {
    const chatId = msg.chat.id;

    await fireGraphs(chatId)
})

bot.onText(/\/horario (\d{1,2}) (\d{1,2})/, async (msg, match) => {

    const chatId = msg.chat.id;

    if (db.get('chats').find({ id: chatId }).value() === undefined) {
        let msg = `Voce precisa estar inscrito para usar este comando.`
        await bot.sendMessage(chatId, msg);
        addToLog({
            action: 'send message',
            chatId,
            message: msg
        })
        return;
    }


    let timeStart = match[1], timeEnd = match[2];

    try {
        timeStart = parseInt(timeStart);
        timeEnd = parseInt(timeEnd);
    } catch (e) {
        console.log('Nao entendi.')
        return;
    };

    /* Time start is always >= 0 */

    if (timeStart > 23) {
        let iMsg = 'Horario de Inicio deve ser < 23h';
        await bot.sendMessage(chatId, iMsg);
        addToLog({
            action: 'send message',
            chatId,
            message: iMsg
        })
        return;
    }

    if (timeEnd < 1) {
        let iMsg = 'Horario de Termino deve ser > 1h';
        await bot.sendMessage(chatId, iMsg);
        addToLog({
            action: 'send message',
            chatId,
            message: iMsg
        })
        return;
    }

    if (timeEnd > 24) {
        let iMsg = 'Horario de Termino deve ser <= 24';
        await bot.sendMessage(chatId, iMsg);
        addToLog({
            action: 'send message',
            chatId,
            message: iMsg
        })
        return;
    }

    if (timeEnd <= timeStart) {
        let iMsg = 'Horario de Termino deve ser mais tarde do que o Horario de Inicio';
        await bot.sendMessage(chatId, iMsg);
        addToLog({
            action: 'send message',
            chatId,
            message: iMsg
        })
        return;
    }


    if (timeStart === 0 && timeEnd === 24) {

        let rmvMessage = 'Removendo restricoes de horarios para notificacoes.';

        await bot.sendMessage(chatId, rmvMessage);
        addToLog({
            action: 'send message',
            chatId,
            rmvMessage
        })

        db.get('chats').find({ id: chatId }).unset('startHour').value();
        db.get('chats').find({ id: chatId }).unset('endHour').value();
        addToLog({
            action: 'Remove startHour and endHour from chatId',
            chatId
        })
        await sendCurrentCount(true)(chatId);

        return;
    }

    /* Only one option left */

    let addMessage = `Adicionando Horario Restrito para notificações: ${timeStart}h-${timeEnd}h`;

    await bot.sendMessage(chatId, addMessage);
    addToLog({
        action: 'send message',
        chatId,
        message: addMessage
    })

    db.get('chats').find({ id: chatId }).set('startHour', timeStart).value();
    db.get('chats').find({ id: chatId }).set('endHour', timeEnd).value();
    addToLog({
        action: 'Add startHour and endHour from chatId',
        chatId,
        startHour: timeStart,
        endHour: timeEnd
    })
    await sendCurrentCount(true)(chatId);
})

const getStateTableCases = (from = 0, to = 27) => {
    let resultSheets = new AsciiTable().fromJSON({
        heading: ['Estado', 'Casos'],
        rows: lastSheetsStateInfo.filter((a, i) => (i >= from) && (i <= to)).map(s => [s.state, s.cases])
    }).setAlignRight(1).setAlignRight(2).toString()

    let finalMsg = strings.stateCases({ resultSheets, lastSheetsUpdate })

    return finalMsg;
}

const getStateTableSuspects = (from = 0, to = 27) => {
    let resultSheets = new AsciiTable().fromJSON({
        heading: ['Estado', 'Casos'],
        rows: lastSheetsStateSuspects.sort((a, b) => {
            if (isNaN(parseInt(a.suspects, 10))) return 1;
            return parseInt(a.suspects, 10) < parseInt(b.suspects, 10) ? 1 : -1;
        }).filter((a, i) => (i >= from) && (i <= to)).map(s => [s.state, s.suspects])
    }).setAlignRight(1).setAlignRight(2).toString()

    let finalMsg = strings.stateSuspects({ resultSheets, lastSheetsUpdate })

    return finalMsg;
}

const fireStates = async (chatId) => {
    let finalMsg = getStateTableCases(0, 4);

    await bot.sendMessage(chatId, finalMsg, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Ver Todos', callback_data: 'change_table_cases' },
                    { text: '⚬', callback_data: 'do_nothing' },
                    { text: '⬇️', callback_data: 'cases_from_5' },
                ], [
                    { text: '⚬ Casos ⚬', callback_data: 'do_nothing'},
                    { text: 'Óbitos', callback_data: 'deaths_from_0' },
                    { text: 'Suspeitos', callback_data: 'suspects_from_0' }
                ]
            ]
        }
    })

    addToLog({
        action: 'send message',
        chatId,
        message: finalMsg
    })
}

bot.onText(/^\/estados$/, async (msg, match) => {
    const chatId = msg.chat.id;
    fireStates(chatId);
})

bot.onText(/\/estados_suspeitos/, async (msg, match) => {
    const chatId = msg.chat.id;
    let finalMsg = getStateTableSuspects();
    await bot.sendMessage(chatId, finalMsg, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Ver Menos', callback_data: 'suspects_from_0' }
                ],
                [
                    { text: 'Casos', callback_data: 'change_table_cases'},
                    { text: 'Óbitos', callback_data: 'change_table_deaths' },                    
                    { text: '⚬ Suspeitos ⚬', callback_data: 'do_nothing' }
                ]
            ]
        }
    })

    addToLog({
        action: 'send message',
        chatId,
        message: finalMsg
    })

})

bot.onText(/\/estados_casos/, async (msg, match) => {
    const chatId = msg.chat.id;
    let finalMsg = getStateTableCases();
    await bot.sendMessage(chatId, finalMsg, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Ver Menos', callback_data: 'cases_from_0' },

                ],
                [
                    { text: '⚬ Casos ⚬', callback_data: 'do_nothing' },
                    { text: 'Óbitos', callback_data: 'change_table_deaths' },                    
                    { text: 'Suspeitos', callback_data: 'change_table_suspects' }
                ]                
            ]
        }
    })

    addToLog({
        action: 'send message',
        chatId,
        message: finalMsg
    })

})

const getStateTableDeaths = (from = 0, to = 27) => {
    let result = new AsciiTable().fromJSON({
        heading: ['Estado', 'Óbitos'],
        rows: lastWCotaStateInfo.filter((a, i) => (i >= from) && (i <= to)).map(s => [s.state, s.deaths])
    }).setAlignRight(1).setAlignRight(2).toString()
    return strings.stateDeaths({ result, lastWCotaUpdateTime });
}

bot.onText(/\/estados_obitos/, async (msg, match) => {
    const chatId = msg.chat.id;

    let finalMsg = getStateTableDeaths();

    await bot.sendMessage(chatId, finalMsg, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Ver Menos', callback_data: 'deaths_from_0' }
                ],
                [
                    { text: 'Casos', callback_data: 'change_table_cases' },
                    { text: '⚬ Óbitos ⚬', callback_data: 'do_nothing' },                    
                    { text: 'Suspeitos', callback_data: 'change_table_suspects' }
                ]                    
            ]
        }
    })

    addToLog({
        action: 'send message',
        chatId,
        message: finalMsg
    })

})

/* TODO: Multiline text */
bot.onText(/\/contato (.*)/, async (msg, match) => {

    const chatId = msg.chat.id;

    let action = { from: chatId, message: match[1], time: (new Date()).toString() };
    fs.appendFileSync('contato.log', JSON.stringify(action) + `\n`);

    addToLog({
        action: 'create feedback',
        chatId,
        message: match[1]
    })

    await bot.sendMessage(chatId, strings.contactThankYou);

})

const chatNumbersAreSame = (chatId) => {
    let values = db.get('chats').find({ id: chatId }).value();

    return ((values.lastValue === lastMSCasesCount) &&
        (values.lastMSDeaths === lastMSDeathsValue) &&
        (values.lastUnofficial === lastSheetsCasesCount) &&
        ((values.lastWMRecovered === lastWMRecovered) || !(values.lastWMRecovered)) &&
        (values.lastUnofficialDeaths === lastSheetsTotalDeaths)
    )
}


const sendCurrentCount = (force = false, saveDB = true) => async (chatId) => {


    if (chatNumbersAreSame(chatId) && (force === false)) {
        console.log('skipping because same value')
        return 'skip';
    }

    const chat = db.get('chats').find({ id: chatId }).value();

    const iValue = chat.interval;
    const iStartHour = chat.startHour;
    const iEndHour = chat.endHour;
    const userUnofficialCases = chat.lastUnofficial;
    const userMSCases = chat.lastValue;
    const userMSDeaths = chat.lastMSDeaths;
    const userSuspects = chat.lastSuspects;
    const userRecovered = chat.lastRecovered;
    const userWMCount = chat.lastWMCount;
    const userWMDeaths = chat.lastWMDeaths;
    const userWMRecovered = chat.lastWMRecovered;
    const userSheetsDeaths = chat.lastUnofficialDeaths;
    const userSheetsTests = chat.lastUnofficialTests;
    const userRegistryDeaths = chat.lastRegistryDeaths;

    console.log('start lastSheetsTotalDeaths', lastSheetsTotalDeaths, userSheetsDeaths)
    const message = strings.startCount({
        lastSheetsCasesCount,
        lastSheetsUpdate,
        lastSheetsTotalSuspects,
        lastSheetsTotalRecovered,
        lastMSCasesCount,
        lastMSDeathsValue,
        lastMSUpdate,
        lastMSRecovered,
        iValue,
        iStartHour,
        iEndHour,
        userUnofficialCases,
        userMSCases,
        userMSDeaths,
        userSuspects,
        userRecovered,
        lastWMCount,
        lastWMDeaths,
        lastWMRecovered,
        lastWMUpdate,
        userWMCount,
        userWMDeaths,
        userWMRecovered,
        lastRegistryDeaths,
        lastRegistryUpdate,
        lastSheetsTotalDeaths,
        lastSheetsTotalTests,
        userSheetsDeaths,
        userSheetsTests,
        userRegistryDeaths
    })

    const getStamp = (brazilianTime) => {
        let datePieces = brazilianTime.split(' ')[0].split('/');
        let internationalOrder = [datePieces[1], datePieces[0], datePieces[2]].join('/');
        let usDate = internationalOrder + ' ' + brazilianTime.split(' ')[1];
        return Math.floor(new Date(usDate).getTime() / 1000)
    }

    let updateTimesPayload = getStamp(lastSheetsUpdate) + '_' + getStamp(lastMSUpdate) + '_' + getStamp(lastWMUpdate) + '_' + getStamp(lastRegistryUpdate)

    const options = { 
        'parse_mode': 'HTML', 
        reply_markup: {
            inline_keyboard: [
                [
                    {text: '🧩 Estados', callback_data: 'fire_states'},
                    {text: '➕ Mais', callback_data: 'smo0_'+ updateTimesPayload}
                ],
                [
                    {text: '📈 Gráficos', callback_data: 'fire_graphs'},
                    {text: '🏥 Leitos/Insumos', callback_data: 'fire_beds_supplies'}
                ]
            ]
        }        
    }
    try {

        if ((chatId < 0) || (('' + chatId).startsWith('@'))) {
            let membersCount = await bot.getChatMembersCount(chatId);
            db.get('chats').find({ id: chatId }).assign({
                membersCount
            }).value() //There is a value/write in the end of the function too
        }

        await bot.sendMessage(chatId, message, options);
        addToLog({
            action: 'send message',
            message,
            options,
            chatId
        })
        let operation = db.get('chats').find({ id: chatId }).assign({
            lastValue: lastMSCasesCount,
            lastMSDeaths: lastMSDeathsValue,
            lastUnofficial: lastSheetsCasesCount,
            lastSuspects: lastSheetsTotalSuspects,
            lastRecovered: lastSheetsTotalRecovered,
            lastWMCount,
            lastWMDeaths,
            lastWMRecovered,
            /* TODO: Reinsert once available */
            lastUnofficialDeaths: lastSheetsTotalDeaths,
            lastUnofficialTests: lastSheetsTotalTests,
            lastRegistryDeaths,
            lastSent: new Date().toUTCString(),
            wipe: 0
        });
        if (saveDB === true) {
            operation.write()
        } else {
            /* Performance optimization */
            operation.value()
        }
        return true;

    } catch (e) {
        addToLog({
            action: 'failed to send message',
            error: e.toString(),
            chatId,
            message
        })
        if ((e.toString().indexOf('ETELEGRAM: 403') !== -1) || (e.toString().indexOf('ETELEGRAM: 400') !== -1)) {
            db.get('chats').find({ id: chatId }).assign({
                wipe: (db.get('chats').find({ id: chatId }).value().wipe) + 1
            }).write()
        }

        return e.toString();
    }
}