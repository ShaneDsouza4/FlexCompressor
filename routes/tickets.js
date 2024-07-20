const express = require("express");

//Simple Tickets
const { 
    handleCreateTicket,
    handleGetAllTickets,
    handleGetTicketByID
} = require("../controllers/tickets");


//Brotli Controller
const {
    handleCreateBrotliTicket,
    handleGetBrotliTicketById,
    handleCreateBulkBrotliTicket
} = require("../controllers/brotli");

//LZMA Controller
const { 
    handleCreateLZMATicket,
    handleGetLZMATicketById
} = require("../controllers/lzma");

//ZSTD Controller
const { 
    handleCreateZSTDTicket,
    handleGetZSTDTicketById
} = require("../controllers/zstd");

const router = express.Router();

//Active Tickets Routes
router.post("/createTicket",handleCreateTicket);
router.get("/getTicket/:id", handleGetTicketByID);
router.get("/getAllTickets", handleGetAllTickets);


//Brotli Routes
router.post("/createBrotliTicket", handleCreateBrotliTicket);
router.get("/getBrotli/:id", handleGetBrotliTicketById);
router.post('/createBulkBrotliTickets', handleCreateBulkBrotliTicket);

//LZMA Routes
router.post("/createLZMATicket", handleCreateLZMATicket);
router.get("/getLZMA/:id", handleGetLZMATicketById);

//ZTD Routes
router.post("/createZSTDTicket", handleCreateZSTDTicket);
router.get("/getZSTD/:id", handleGetZSTDTicketById);

module.exports = router;
