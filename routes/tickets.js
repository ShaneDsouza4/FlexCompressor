const express = require("express");
const {
    handleCreateBrotliTicket,
    handleGetBrotliTicketById
} = require("../controllers/brotli");

const { 
    handleCreateLZMATicket,
    handleGetLZMATicketById
} = require("../controllers/lzma");

const { 
    handleCreateZSTDTicket,
    handleGetZSTDTicketById
} = require("../controllers/zstd");

const router = express.Router();

router.post("/createBrotliTicket", handleCreateBrotliTicket);
router.get("/getBrotli/:id", handleGetBrotliTicketById);

router.post("/createLZMATicket", handleCreateLZMATicket);
router.get("/getLZMA/:id", handleGetLZMATicketById);

router.post("/createZSTDTicket", handleCreateZSTDTicket);
router.get("/getZSTD/:id", handleGetZSTDTicketById);

module.exports = router;
