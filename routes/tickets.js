const express = require("express");

//Simple Tickets
const { 
    handleCreateTicket,
    handleGetAllTickets,
    handleGetTicketByID,
    handleGetAllArchivedTickets,
    archiveTickets
} = require("../controllers/tickets");

const {
    getArchivedTicketByTicketId,
    getArchivedTicketById
} = require("../controllers/archivedtickets");


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
router.post("/archiveTickets", archiveTickets);

//General archive Tickets Routes
router.get("/getArchivedTicket/ticketid/:id", getArchivedTicketByTicketId);
router.get("/getArchivedTicket/:id", getArchivedTicketById);

router.get("/getAllArchivedTickets", handleGetAllArchivedTickets)

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
// router.post("/createactive", )



module.exports = router;
