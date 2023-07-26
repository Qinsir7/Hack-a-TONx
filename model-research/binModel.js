const fs = require("fs");
const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const START_DATE = "4/10/2023";
const END_DATE = "7/10/2023";
const WINDOW_SIZE = 15;
const DAILY_POLICY_SOLD = 100;
const u = 1.1;
const d = 0.9;
const q = 0.5;

function calculateOptionPrice(currentPrice, triggerPrice, payoutAmount) {
  const tree = new Array(WINDOW_SIZE + 1)
    .fill(0)
    .map(() => new Array(WINDOW_SIZE + 1).fill(0));

  for (let j = 0; j <= WINDOW_SIZE; j++) {
    tree[WINDOW_SIZE][j] =
      currentPrice * Math.pow(u, j) * Math.pow(d, WINDOW_SIZE - j);
  }

  for (let j = 0; j <= WINDOW_SIZE; j++) {
    tree[WINDOW_SIZE][j] =
      tree[WINDOW_SIZE][j] >= triggerPrice ? payoutAmount : 0;
  }

  for (let i = WINDOW_SIZE - 1; i >= 0; i--) {
    for (let j = 0; j <= i; j++) {
      const earlyExercise = tree[i][j] >= triggerPrice ? payoutAmount : 0;
      const continueValue = q * tree[i + 1][j + 1] + (1 - q) * tree[i + 1][j];
      tree[i][j] = Math.max(earlyExercise, continueValue);
    }
  }

  return tree[0][0];
}

function fetchGasInfo(filePath, startDate, endDate, callback) {
  const prices = [];
  const dates = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => {
      const date = data.Date;
      const parsedDate = new Date(date);
      const startDateParsed = new Date(startDate);
      const endDateParsed = new Date(endDate);

      if (parsedDate >= startDateParsed && parsedDate <= endDateParsed) {
        prices.push(parseFloat(data.Value));
        dates.push(date);
      }
    })
    .on("end", () => {
      callback(dates, prices);
    });
}

function runBacktest(dates, prices) {
  const results = [];
  let cumulativeProfit = 0;

  for (let i = WINDOW_SIZE; i < prices.length; i++) {
    const currentPrice = prices[i];
    const triggerPrice = currentPrice * 1.1;
    const payoutAmount = currentPrice * 0.05;

    const policyPrice = calculateOptionPrice(
      currentPrice,
      triggerPrice,
      payoutAmount
    );

    const dailyProfit =
      DAILY_POLICY_SOLD * policyPrice -
      (prices[i + 1] && prices[i + 1] >= triggerPrice
        ? DAILY_POLICY_SOLD * payoutAmount
        : 0);
    cumulativeProfit += dailyProfit;

    results.push({
      date: dates[i],
      currentPrice: currentPrice.toFixed(2),
      triggerPrice: triggerPrice.toFixed(2),
      payoutAmount: payoutAmount.toFixed(2),
      policyPrice: policyPrice.toFixed(2),
      dailyProfit: dailyProfit.toFixed(2),
      cumulativeProfit: cumulativeProfit.toFixed(2),
    });
  }

  return results;
}

fetchGasInfo(
  "./AvgGasPrice_Gwei.csv",
  START_DATE,
  END_DATE,
  (dates, prices) => {
    const backtestResult = runBacktest(dates, prices);

    const csvWriter = createCsvWriter({
      path: "./resultData/binBacktest.csv",
      header: [
        { id: "date", title: "date" },
        { id: "currentPrice", title: "currentPrice" },
        { id: "triggerPrice", title: "triggerPrice" },
        { id: "payoutAmount", title: "payoutAmount" },
        { id: "policyPrice", title: "policyPrice" },
        { id: "dailyProfit", title: "dailyProfit" },
        { id: "cumulativeProfit", title: "cumulativeProfit" },
      ],
    });

    csvWriter.writeRecords(backtestResult).then(() => {
      console.log("save to binBacktest.csv ");
    });
  }
);
