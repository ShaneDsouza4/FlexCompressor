const cron = require("node-cron");
const {recompressArchived} = require('./archivedtickets');
const {archiveOldTickets} = require('./tickets');

function runCron() {
  //cron.schedule("0 0 * * 0", async () => {// Runs every Sunday 12am
  //cron.schedule("0 0 1 * *", async () => { //Runs at 12am on the first on every month
  cron.schedule("* * * * *", async () => { //Runs every minute
    await recompressArchived();
    await archiveOldTickets();
  });
}

module.exports = {
    runCron
}