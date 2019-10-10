require('dotenv').config()

const telegramBot = require('node-telegram-bot-api');

const token = process.env.TOKEN;

const api = new telegramBot (token, {polling: true});

const axios = require('axios');

function bot(cmd, url, message) {
	api.onText(/\/cmd/, function(msg, match) {
    let fromId = msg.from.id;
    api.sendMessage(fromId, message)
	});
}

function logger() {
  db.addLog({
        name: msg.from.first_name,
        id: msg.from.id
    }, {
        chat_id: msg.chat.id, 
        id: msg.message_id,
        text: match[1]
    }) 
}

api.onText(/\/help/, function(msg, match) {
  let fromId = msg.from.id;
  api.sendMessage(fromId, "I can help you in getting the latest information about bitcoin (BTC).");
  logger();
});

api.onText(/\/start/, function(msg, match) {
  let fromId = msg.from.id;
  let fromName = msg.from.first_name;
  api.sendMessage(fromId, "Hello "+fromName+". They call me BTC Support Bot. " + 
                          "I can help you in getting the latest information about bitcoin (BTC). "+
                          "To help you, here area a few commands.\n/help\n/start\n/difficulty\n/tx txid\n/btc");
  logger();
});

api.onText(/\/difficulty/, function(msg, match) {
	let fromId = msg.from.id;
	axios.get('https://blockchain.info/q/getdifficulty')
                .then(function(response) {
                   api.sendMessage(fromId, "The difficulty is: " + response.data);   
                });
  logger();
});

api.onText(/\/btc/, function(msg, match) {
  let fromId = msg.from.id;
  axios.get('https://api.coindesk.com/v1/bpi/currentprice/zar.json')
                    .then(response => {
                        let usd = response.data.bpi.USD.rate_float;
                        api.sendMessage(fromId, "The BTC exchange rate is: $" + usd);
                    });
  axios.get('https://api.mybitx.com/api/1/ticker?pair=XBTZAR')
                    .then(response => {
                        let zar = response.data.last_trade;
                        api.sendMessage(fromId, "The ZAR exchange rate is: R" + zar);
                    });
  logger();
});


console.log("BTC Support Bot has started. Start conversations in your Telegram.");
