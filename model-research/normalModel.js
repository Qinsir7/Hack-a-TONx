const fs = require("fs");
const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const START_DATE = "4/10/2023";
const END_DATE = "7/10/2023";
const WINDOW_SIZE = 15;
const DAILY_POLICY_SOLD = 100;

function calculateMaxRise(prices) {
  let maxRise = 0;

  for (let i = 1; i < prices.length; i++) {
    const rise = prices[i] / prices[i - 1] - 1;
    if (rise > maxRise) maxRise = rise;
  }

  return maxRise;
}

function calculatePayoutFactor(prices) {
  const currentPrice = prices[prices.length - 1];
  const maxRise = calculateMaxRise(prices);
  const triggerPrice = currentPrice * (1 + maxRise);
  const policyPrice = calculatePolicyPrice(maxRise, currentPrice * 0.05);
  return policyPrice / (triggerPrice - currentPrice);
}

function calculatePolicyPrice(maxRise, expectedPayoutAmount) {
  const expectedPayoutProbability = maxRise;
  const expectedPayout = expectedPayoutProbability * expectedPayoutAmount;
  return expectedPayout * 1.15;
}

function isWithinRange(dateStr, startDateStr, endDateStr) {
  const date = new Date(dateStr);
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  return date >= startDate && date <= endDate;
}

function fetchGasInfo(filePath, startDate, endDate, callback) {
  const prices = [];
  const dates = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => {
      const date = data.Date;
      if (isWithinRange(date, startDate, endDate)) {
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
    const windowPrices = prices.slice(i - WINDOW_SIZE, i);
    const maxRise = calculateMaxRise(windowPrices);
    const currentGasPrice = prices[i];
    const payoutFactor = calculatePayoutFactor(windowPrices);

    const triggerPrice = currentGasPrice * (1 + maxRise);
    const payoutAmount = currentGasPrice * payoutFactor;
    const policyPrice = calculatePolicyPrice(maxRise, payoutAmount);

    let dailyPayout = 0;
    for (let j = i + 1; j <= i + WINDOW_SIZE && j < prices.length; j++) {
      if (prices[j] >= triggerPrice) {
        dailyPayout = payoutAmount * DAILY_POLICY_SOLD;
        break;
      }
    }

    const dailyProfit = DAILY_POLICY_SOLD * policyPrice - dailyPayout;
    cumulativeProfit += dailyProfit;

    results.push({
      date: dates[i],
      currentPrice: currentGasPrice.toFixed(2),
      maxRise: maxRise.toFixed(4),
      triggerPrice: triggerPrice.toFixed(2),
      policyPrice: policyPrice.toFixed(2),
      dailyPayout: dailyPayout.toFixed(2),
      dailyProfit: dailyProfit.toFixed(2),
      cumulativeProfit: cumulativeProfit.toFixed(2),
      payoutFactor: payoutFactor.toFixed(4),
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
      path: "./resultData/normalBackTest.csv",
      header: [
        { id: "date", title: "date" },
        { id: "currentPrice", title: "currentPrice" },
        { id: "maxRise", title: "maxRise" },
        { id: "triggerPrice", title: "triggerPrice" },
        { id: "policyPrice", title: "policyPrice" },
        { id: "dailyPayout", title: "dailyPayout" },
        { id: "dailyProfit", title: "dailyProfit" },
        { id: "cumulativeProfit", title: "cumulativeProfit" },
        { id: "payoutFactor", title: "payoutFactor" },
      ],
    });

    csvWriter.writeRecords(backtestResult).then(() => {
      console.log("save to normalBacktest.csv");
    });
  }
);
