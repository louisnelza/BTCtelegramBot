require('dotenv').config()
const telegramBot = require('node-telegram-bot-api');
const token = process.env.TOKEN;
const api = new telegramBot(token, { polling: true });
const axios = require('axios');
const fetch = require("node-fetch");
const db = require("./db");
const OpenAI = require("openai");

const openAI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
      let usd = (response.data.bpi.USD.rate_float).toFixed(0);
      api.sendMessage(fromId, "The Coindesk rate is: $" + usd);
    });
  axios.get('https://api.mybitx.com/api/1/ticker?pair=XBTZAR')
    .then(response => {
      let zar = parseInt(response.data.last_trade).toFixed(0);
      api.sendMessage(fromId, "The Luno rate is: R" + zar);
    });
  axios.get('https://api.valr.com/v1/public/BTCZAR/marketsummary')
    .then(response => {
      const zar = parseInt(response.data.lastTradedPrice).toFixed(0);
      api.sendMessage(fromId, "The VALR rate is: R" + zar);
    });
  logger();
});

api.onText(/\/spread/, function (msg, match) {
  let fromId = msg.from.id;
  Promise.all([
    fetch("https://www.bitstamp.net/api/v2/ticker/btcgbp/"),
    fetch("https://api.mybitx.com/api/1/ticker?pair=XBTZAR"),
    fetch(`https://free.currconv.com/api/v7/convert?q=GBP_ZAR&compact=ultra&apiKey=${process.env.API_KEY}`)
  ]).then(async ([aa, bb, cc]) => {
    const a = await aa.json();
    const b = await bb.json();
    const c = await cc.json();
    return { a, b, c }
  })
    .then((responseText) => {
      let bitstamp = parseInt(responseText.a.last)
      let luno = parseInt(responseText.b.last_trade)
      let luno_GBP = (luno / responseText.c.GBP_ZAR).toFixed(2)
      let spread = ((luno_GBP - bitstamp) / luno_GBP * 100).toFixed(2)
      api.sendMessage(fromId, `The Bitstamp price is: £${bitstamp}`);
      api.sendMessage(fromId, `The Luno price in GBP: £${luno_GBP}`);
      api.sendMessage(fromId, `The spread is: ${spread}%`);
    })
})

// Define a new function to handle incoming messages with ChatGPT
async function handleGPTMessage(msg) {
  // Get the message text from the user
  const messageText = msg.text;

  // Call OpenAI's GPT-3 API to generate a response
  const completion = await openAI.createCompletion({
    model: "text-davinci-003",
    prompt: messageText,
    max_tokens: 256,
    temperature: 0,
  });
  const gptResponse = completion.data.choices[0].text;

  // Send the response back to the user
  api.sendMessage(msg.chat.id, gptResponse);

  // Log the conversation in the database
  db.addLog(
    { name: msg.from.first_name, id: msg.from.id },
    { chat_id: msg.chat.id, id: msg.message_id, text: messageText }
  );
}

// Add the GPT-3 message handler to the Telegram bot's message event
api.onText(/\/prompt (.+)/, async (msg, match) => {
    await handleGPTMessage(msg);
});

console.log("BTC Support Bot has started. Start conversations in your Telegram.");