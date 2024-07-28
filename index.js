require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectToMongoDB } = require("./connection");
const TICKET = require("./models/archiveTickets.js");
const ticketRoute = require("./routes/tickets");
const analyticsRoute = require("./routes/analytics.js");
const status = require('express-status-monitor');

const path = require("path");
const PORT = 8000;
const { runCron } = require("./controllers/cron.js");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.json({ limit: '1000mb' }));
app.use(express.urlencoded({ limit: '1000mb', extended: true }));
app.use(status());

//Uncomment to enable cronjob
//runCron(); 

//connectToMongoDB("mongodb://127.0.0.1:27017/flexCompressor")
connectToMongoDB(process.env.MONGO_URL)
    .then(() => console.log("MongoDB connected."));

//Routes Usage
app.use("/api/ticket", ticketRoute);
app.use("/api/analytics", analyticsRoute);

app.listen(PORT, () => console.log(`Server running on PORT: ${PORT}`));
