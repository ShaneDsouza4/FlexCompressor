const express = require("express");
const { 
    handleCreateTicket ,
    handleGetTicketById
} = require("../controllers/tickets")

const { 
    handleCreateLZMATicket,
    handleGetLZMATicketById
} = require("../controllers/lzma");

const {testZstd} = require("../controllers/zstd");


const router = express.Router();

router.post("/createzstdticket", testZstd);
router.post("/createTicket", handleCreateTicket);
router.get("/:id", handleGetTicketById);

router.post("/createLZMATicket", handleCreateLZMATicket);
router.get("/getLZMA/:id", handleGetLZMATicketById);

module.exports = router;
