require("dotenv").config();
const express = require("express");
const { connectToMongoDB } = require("./connection");
const TICKET = require("./models/archiveTickets.js");
const ticketRoute = require("./routes/tickets");
const analyticsRoute = require("./routes/analytics.js");

const path = require("path");
const PORT = 8000;
const cron = require("node-cron");

const app = express();
app.use(express.json()); 

// cron to run task
cron.schedule('* * * * *', () => {
    // console.log('running a task every minute');
  });

//connectToMongoDB("mongodb://127.0.0.1:27017/flexCompressor")
connectToMongoDB(process.env.MONGO_URL)
.then(()=>console.log("MongoDB connected."));

app.get("/", (req, res)=>{
    res.send("Hello");
})

app.use("/api/ticket",ticketRoute);
app.use("/api/analytics", analyticsRoute);

app.listen(PORT, ()=>console.log(`Server running on PORT: ${PORT}`));


