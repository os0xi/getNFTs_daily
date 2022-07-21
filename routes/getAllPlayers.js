const router = require("express").Router();
const fs = require("fs");
const axios = require("axios");
const { playersList } = require("../playerlist.js");
const { response } = require("express");

async function getPlayerData(name, res) {
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

async function getAllPlayersData(res) {
  for (const [a, b] of playersList) {
    await getPlayerData(a, res);
  }
}

router.get("/", async (req, res) => {
  console.log(playersList);
  await getAllPlayersData(res);
  res.render("loadedPlayers");
});

module.exports = router;
