/* Load dotenv before code to apply environment variables */
require('dotenv').config()

const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;


const { Builder, By, until } = require('selenium-webdriver');


const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)

// Set some defaults (required if your JSON file is empty)
db.defaults({ 
    chats: [], count: null, unofficialCount: null, deaths: '0', log: [], MSUpdate: '', unofficialUpdate: '' 
}).write()

let lastValue = db.get('count').value();
let lastDeathsValue = db.get('deaths').value();
let lastMSUpdate = db.get('MSUpdate').value();
let lastUnofficialUpdate = db.get('unofficialUpdate').value();

const updateCount = async function () {
    let driver = await new Builder().forBrowser('chrome').build();
    try {
        await driver.get('http://plataforma.saude.gov.br/novocoronavirus/#COVID-19-brazil');
        await driver.wait(until.elementTextMatches(driver.findElement(By.id('BRCardCases')), /.+/ ), 45000);

        const element = await driver.findElement(By.id('BRCardCases'));
        /* TODO: */
        const newValue = (await (element.getAttribute('innerText'))).split(' ')[0];
        const eDeaths = await driver.findElement(By.id('BRCardDeaths'));
        const newDeaths = (await (eDeaths.getAttribute('innerText'))).split(' ')[0];

        const eMS = await driver.findElement(By.className('text-muted'));
        const newMS = (await (eMS.getAttribute('innerText')));


        // const newValue = getRandomInt(0, 2)
        if (newValue === '') {
            throw new Error('Empty Value as result')
        }
        const item = {
            action: 'update value',
            value: newValue,
        };
        /* TODO: Use transaction here */
        addToLog(item);
        db.set('count', newValue).write();
        lastValue = newValue;
        db.set('deaths', newDeaths).write();
        lastDeathsValue = newDeaths;
        console.log("DEATHS", lastDeathsValue)
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

let lastUnofficialValue = db.get('unofficialCount').value();


const updateUnofficialCount = async function () {
    try {
        /* TODO: */
        const {newValue, date} = await require('./unofficial')();
        if (newValue === '') {
            throw new Error('Empty Value as result')
        }
        const item = {
            action: 'update unofficial value',
            value: newValue,
            date
        };
        /* TODO: Use transaction here */
        addToLog(item);
        db.set('unofficialCount', newValue).write();
        lastUnofficialValue = newValue;
        db.set('unofficialUpdate', date).write();
        lastUnofficialUpdate = date;
        return newValue;
    } catch (e) {
        const item = {
            action: 'fail update unofficial',
            value: e.toString(),
        };
        addToLog(item)
        console.log('Failed to Update:', e)
        return null;
    }
};


const maybeSendUpdates = async () => {
    let previousValue = lastValue;
    let previousUnofficial = lastUnofficialValue;
    let previousDeaths = lastDeathsValue;
    await updateCount();
    await updateUnofficialCount();
    if ((previousValue !== lastValue) || (previousUnofficial !== lastUnofficialValue) || (previousDeaths !== lastDeathsValue)) {
        sendUpdates();
    } else {
        addToLog({
            action: 'No Changes In Count',
            count: lastValue,
            unofficial: lastUnofficialValue
        })
    }
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
}

const sendUpdates = async () => {
    let chats = db.get('chats').value();

    asyncForEach(chats, async (chat) => {
        await maybeSendCurrentCount(chat.id);
    })
}

const maybeSendCurrentCount = async (chatId) => {
    /* min * sec (60) * millisec (1000) */
    let interval = db.get('chats').find({id: chatId}).value().interval;
    let toAdd = (interval || 0) * 60 * 1000;
    let lastSent = db.get('chats').find({id: chatId}).value().lastSent;
    let lastSentTime = lastSent ? new Date(lastSent).getTime() : 0;
    let nextTime = lastSentTime + toAdd;
    let currTime = new Date().getTime();

    let startHour = (db.get('chats').find({id: chatId}).value().startHour || 0);
    let endHour = (db.get('chats').find({id: chatId}).value().endHour || 24);
    let currHour = new Date().getHours();
    let passHourTest = (startHour <= currHour) && (currHour < endHour);

    if ((currTime > nextTime) && passHourTest) {
        await sendCurrentCount(chatId);
    } else {
        addToLog({
            action: 'Skip Send Count',
            chatId,
            nextTime,
            currTime,
            startHour,
            endHour,
            currHour,
            toAdd
        })
    }
}

/* 
    Important! I froze my computer because I did not have this defined.
    Time to update in miliseconds.
 */

 /* TODO: */
const timeToUpdate = 1000 * 60 * 15; // 15 minutes
// const timeToUpdate = 1000 * 60 * 1; // 1 minute

maybeSendUpdates();
setInterval(maybeSendUpdates, timeToUpdate)


const addToLog = (obj) => {
    console.log(obj);
    db.get('log').push({
        ...obj,
        _time: new Date().toUTCString()
    }).write();
}

const bot = new TelegramBot(token, { polling: true });
bot.onText(/\/start/, async (msg, match) => {
    const chatId = msg.chat.id;
    const resp = match[1];
    const startChatAction = {
        action: 'chat id receive start',
        chatId
    }
    addToLog(startChatAction);
    /* TODO: Use object instead */
    if (db.get(`chats`).find({id: chatId}).value() === undefined) {

        addToLog({
            action: 'New subscription',
            chatId,
        })

        let startSubscription = `Bem-vindo! Você receberá atualizações sobre o número de casos confirmados de COVID-19 no Brasil.

Para ver os comandos possíveis, utilize /ajuda.    
    `;
        await bot.sendMessage(chatId, startSubscription);
        addToLog({
            action: 'send message',
            message: startSubscription,
            chatId
        })        

        db.get('chats').push({
            id: chatId,
            lastValue: null,
            lastUnofficial: null,
            lastSent: null
        }).write()

        await sendCurrentCount(chatId);

    } else {
        addToLog({
            action: 'Existent Subscription, no changes',
            chatId,
        }) 
        await sendCurrentCount(chatId);
    }
});

bot.onText(/\/stop/, async (msg, match) => {
    const chatId = msg.chat.id;
    const stopChatAction = {
        action: 'chat id receive stop',
        chatId
    }
    addToLog(stopChatAction);    

    if (db.get(`chats`).find({id: chatId}).value() !== undefined) {
        addToLog({
            action: 'Cancel subscription',
            chatId
        })        

        db.get(`chats`).remove((i) => i.id === chatId).write();
        let cancelSubscription = `Inscricao Cancelada. Voce nao recebera mais atualizacoes. Obrigado por usar o bot :)`;
        await bot.sendMessage(chatId, cancelSubscription);
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

bot.onText(/\/intervalo (\d{1,4})/, async (msg, match) => {

    const chatId = msg.chat.id;

    if (db.get('chats').find({id: chatId}).value() === undefined) {
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
            configMessage = `Configurando intervalo minimo para ${time} minutos.`;
        } else {
            configMessage = `Removendo intervalo minimo de notificacao.`
        }

        await bot.sendMessage(chatId, configMessage);
        addToLog({
            action: 'send message',
            chatId,
            configMessage
        })

        if (time !== 0) {
            /* Using value to batch with next change (addToLog will write) */
            db.get('chats').find({id: chatId}).assign({
                interval: time
            }).value();

            addToLog({
                action: 'Add interval to chatId',
                chatId,
                time
            })        
        } else {
            /* Using value to batch with next change (addToLog will write) */
            db.get('chats').find({id: chatId}).unset('interval').value();

            addToLog({
                action: 'Remove interval from chatId',
                chatId
            })                  
        }

        await sendCurrentCount(chatId);

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

    let resultMsg = `
<b>/start</b> - Inicia a inscrição para atualizacoes (caso nao inscrito), e envia o numero atual de casos.
<b>/stop</b> - Desativa a inscrição
<b>/intervalo</b> <i>[minutos]</i> - diminua a frequência de mensagens. Por exemplo, <code>/intervalo 45</code> garante que você não irá receber duas mensagens seguidas em um período de 45 minutos. Para voltar ao padrão, utilize <code>/intervalo 0</code>
<b>/horario</b> <i>[comeco] [fim]</i> - Restrinja as atualizações a uma faixa de horario. Por exemplo, <code>/horario 8 14</code> receberá mensagens apenas entre as 8h e as 13:59:59h. Para voltar ao padrao, use <code>/horario 0 24.</code>
<b>/usuarios</b> - Número de usuários utilizando esse bot.  
<b>/ajuda</b> - Exibe esta mensagem.
`;
    await bot.sendMessage(chatId, resultMsg, {parse_mode: 'HTML'});    
    addToLog({
        action: 'send message',
        chatId,
        message: resultMsg
    })    
})

bot.onText(/\/usuarios/, async (msg, match) => {
    const chatId = msg.chat.id;

    let resultMsg = `👩‍🦰 ${db.get('chats').value().length} usuarios 👨`;
    await bot.sendMessage(chatId, resultMsg);    
    addToLog({
        action: 'send message',
        chatId,
        message: resultMsg
    })    
})

bot.onText(/\/horario (\d{1,2}) (\d{1,2})/, async (msg, match) => {

    const chatId = msg.chat.id;

    if (db.get('chats').find({id: chatId}).value() === undefined) {
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

        db.get('chats').find({id: chatId}).unset('startHour').value();
        db.get('chats').find({id: chatId}).unset('endHour').value();
        addToLog({
            action: 'Remove startHour and endHour from chatId',
            chatId
        })
        await sendCurrentCount(chatId);

        return;
    }

    /* Only one option left */

    let addMessage = `Adicionando Horario Restrito para notificacoes: ${timeStart}h-${timeEnd}h`;

    await bot.sendMessage(chatId, addMessage);
    addToLog({
        action: 'send message',
        chatId,
        message: addMessage
    })

    db.get('chats').find({id: chatId}).set('startHour', timeStart).value();
    db.get('chats').find({id: chatId}).set('endHour', timeEnd).value();
    addToLog({
        action: 'Add startHour and endHour from chatId',
        chatId,
        startHour: timeStart,
        endHour: timeEnd
    })    
    await sendCurrentCount(chatId);


})


const sendCurrentCount = async (chatId) => {
    const iValue = db.get('chats').find({id: chatId}).value().interval;
    const iStartHour = db.get('chats').find({id: chatId}).value().startHour;
    const iEndHour = db.get('chats').find({id: chatId}).value().endHour;
    const message = `- Casos no <b>Brasil:</b> 🇧🇷
    - Ministério da Saúde (oficial): <b>${lastValue}</b>
    - Secretarias e Municípios: <b>${lastUnofficialValue}</b>
` + (
(lastDeathsValue > 0) ? `
- Óbitos:
    - Ministério da Saúde (oficial): <b>${lastDeathsValue}</b>
` : ``   
) + `
* Ministério da Saúde: ${lastMSUpdate}
` +
`
* Secretarias e Municípios: Dados Atualizados em ${lastUnofficialUpdate}
` +
(iValue ? `
🔄 Freq. mínima de notificação: ${iValue} minutos.
` : `
🔄 Freq. mínima de notificação: instantânea.
`) + (iStartHour ? `
⏰ Notificações restritas ao período ${iStartHour}h-${iEndHour}.
`: `
⏰ Notificações irrestritas (0h-24h).
`)

    const options = {'parse_mode': 'HTML'}
    try {
        // console.log('"debug send"', chatId, message)
        await bot.sendMessage(chatId, message, options);
        addToLog({
            action: 'send message',
            message,
            options,
            chatId
        })
        db.get('chats').find({id: chatId}).assign({
            lastValue,
            lastUnofficial: lastUnofficialValue,
            lastSent: new Date().toUTCString()
        }).write()

    } catch(e) {
        addToLog({
            action: 'failed to send message',
            error: e.toString(),
            chatId,
            message
        })
    }
}



function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}