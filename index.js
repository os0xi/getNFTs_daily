const express = require("express");
var ejs = require("ejs");
const app = express();
const dotenv = require("dotenv");
const schedule = require("node-schedule");
const fs = require("fs");
const axios = require("axios");

const { playersList } = require("./playerlist.js");
const allPlayersRoute = require("./routes/getAllPlayers");

async function getPlayerData(name) {
  let playerTransactions = [];
  let cursor = null;
  let page = 0;
  do {
    console.log(name, ", page ", page);
    const options = {
      method: "GET",
      url: "https://opensea13.p.rapidapi.com/events",
      params: {
        only_opensea: "false",
        account_address: playersList.get(name).address,
        event_type: "successful",
        cursor: cursor,
      },
      headers: {
        "X-RapidAPI-Key": process.env.RAPID_KEY,
        "X-RapidAPI-Host": "opensea13.p.rapidapi.com",
      },
    };
    const response = await axios.request(options);
    const res = response.data;
    const transactions = response.data.asset_events;
    transactions.forEach((transaction) => {
      playerTransactions.push(transaction);
    });
    cursor = res.next;
    page++;
  } while (cursor != null && cursor != "");
  const jsonTransactions = JSON.stringify(playerTransactions);
  fs.writeFile(
    `${name.replace(/\s+/g, "")}.json`,
    jsonTransactions,
    "utf8",
    function (err) {
      if (err) {
        console.log("error");
        return console.log(err);
      }
      console.log("JSON Saved");
    }
  );
}

async function getAllPlayersData() {
  for (const [a, b] of playersList) {
    await getPlayerData(a);
  }
}

app.set("view engine", "ejs");
app.engine("ejs", require("ejs").__express);
dotenv.config();

function runServer() {
  getAllPlayersData();
  schedule.scheduleJob("0 0 * * *", getAllPlayersData);
  console.log("running");
}

app.set("view engine", "ejs");
app.use("/getAllPlayers", allPlayersRoute);

app.listen(3001, runServer);
