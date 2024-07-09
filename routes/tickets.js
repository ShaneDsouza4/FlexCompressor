const express = require("express");
const { 
    handleCreateTicket 
} = require("../controllers/tickets")

const router = express.Router();

router.post("/createTicket", handleCreateTicket);

module.exports = router;
