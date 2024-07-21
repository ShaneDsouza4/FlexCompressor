const cron = require("node-cron");

function runCron() {
  // cron to run task
  cron.schedule("* * * * *", () => {
    // console.log('running a task every minute');
  });
}

module.exports = {
    runCron
}