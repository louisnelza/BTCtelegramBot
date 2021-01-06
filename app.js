require('dotenv').config()
const telegramBot = require('node-telegram-bot-api');
const token = process.env.TOKEN;
const api = new telegramBot(token, { polling: true });
const axios = require('axios');
const fetch = require("node-fetch");
const db = require("./db");

// write a generic function to avoid repetion
function bot(cmd, url, message) {
  api.onText(/\/cmd/, function (msg, match) {
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

api.onText(/\/help/, function (msg, match) {
  let fromId = msg.from.id;
  api.sendMessage(fromId, "I can help you in getting the latest information about bitcoin (BTC).");
  logger();
});

api.onText(/\/start/, function (msg, match) {
  let fromId = msg.from.id;
  let fromName = msg.from.first_name;
  api.sendMessage(fromId, "Hello " + fromName + ". They call me BTC Support Bot. " +
    "I can help you in getting the latest information about bitcoin (BTC). " +
    "To help you, here area a few commands.\n/help\n/start\n/difficulty\n/tx txid\n/btc");
  logger();
});

api.onText(/\/difficulty/, function (msg, match) {
  let fromId = msg.from.id;
  axios.get('https://blockchain.info/q/getdifficulty')
    .then(function (response) {
      api.sendMessage(fromId, "The difficulty is: " + response.data);
    });
  logger();
});

api.onText(/\/tx (.+)/, function (msg, match) {
  var fromId = msg.from.id;
  const txid = match[1];
  axios.get(`https://chain.api.btc.com/v3/tx/${txid}`)
    .then(response => {
      let confirmations = response.data.data.confirmations
      api.sendMessage(fromId, "The transaction has: " + confirmations + " confirmations.");
    });
  logger();
});

api.onText(/\/btc/, function (msg, match) {
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

api.onText(/\/spread/, function (msg, match) {
  let fromId = msg.from.id;
  Promise.all([
    fetch("https://www.bitstamp.net/api/v2/ticker/btcgbp/"),
    fetch("https://api.mybitx.com/api/1/ticker?pair=XBTZAR"),
    fetch("https://free.currconv.com/api/v7/convert?q=GBP_ZAR&compact=ultra&apiKey=78ac46631b252f3df334")
  ]).then(async([aa, bb, cc]) => {
    const a = await aa.json();
    const b = await bb.json();
    const c = await cc.json();
    return {a, b, c}
  })
  .then((responseText) => {
    let bitstamp = parseInt(responseText.a.last)
    let luno = parseInt(responseText.b.last_trade)
    let luno_GBP = (luno / responseText.c.GBP_ZAR).toFixed(2) 
    let spread = (( luno_GBP - bitstamp ) / luno_GBP * 100).toFixed(2)
    api.sendMessage(fromId, `The Bitstamp price is: £${bitstamp}`);
    api.sendMessage(fromId, `The Luno price in GBP: £${luno_GBP}`);
    api.sendMessage(fromId, `The spread is: ${spread}%`);
  })
})


console.log("BTC Support Bot has started. Start conversations in your Telegram.");