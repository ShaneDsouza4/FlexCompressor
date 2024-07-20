require("dotenv").config();
const express = require("express");
const { connectToMongoDB } = require("./connection");
const TICKET = require("./models/tickets");
const ticketRoute = require("./routes/tickets");
const path = require("path");
const PORT = 8000;

const app = express();
app.use(express.json()); 


//connectToMongoDB("mongodb://127.0.0.1:27017/flexCompressor")
connectToMongoDB(process.env.MONGO_URL)
.then(()=>console.log("MongoDB connected."));

app.get("/", (req, res)=>{
    res.send("Hello");
})

app.use("/api/ticket",ticketRoute);

app.listen(PORT, ()=>console.log(`Server running on PORT: ${PORT}`));


