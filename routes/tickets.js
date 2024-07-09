const express = require("express");
const { 
    handleCreateTicket ,
    handleGetTicketById
} = require("../controllers/tickets")

const router = express.Router();

router.post("/createTicket", handleCreateTicket);
router.get("/:id", handleGetTicketById);

module.exports = router;
