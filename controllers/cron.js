const cron = require("node-cron");
const {recompressArchived} = require('./archivedtickets');
const {archiveOldTickets} = require('./tickets');

function runCron() {
  cron.schedule("* * * * *", async () => {
    console.log('running a task every minute');
    await recompressArchived();
    await archiveOldTickets();
  });
}

module.exports = {
    runCron
}