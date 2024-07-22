const cron = require("node-cron");
const {recompressArchived} = require('./archivedtickets');

function runCron() {
  // cron to run task
  cron.schedule("* * * * *", async () => {
    console.log('running a task every minute');
    await recompressArchived();
  });
}

module.exports = {
    runCron
}