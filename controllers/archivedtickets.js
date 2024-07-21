const ArchiveTickets = require("../models/archiveTickets.js");
const lzma = require("lzma");
const {brotliDecompression} = require("./brotli.js")
const {lzmaDecompression} = require("./lzma.js")
const {zstdDecompression} = require("./zstd.js")

async function decompressData(ticket) {
    switch (ticket.compressor) {
        case "Brotli":
            return brotliDecompression(ticket);

        case "LZMA":
            return await lzmaDecompression(ticket);
        
        case "ZSTD":
            return await zstdDecompression(ticket);
        default:
            break;
    }
}

async function getArchivedTicketByTicketId(req, res) {
    try{
        const tickets = await ArchiveTickets.find({
            ticketID: req.params.id
        });
        if(!tickets || !tickets.length){
            return res.status(404).json({msg:"No ticket found!"});
        }
        const [ticket] = tickets;
        const [decompressedData, decompressionTime] = await decompressData(ticket)
        // Increment the access count
        ticket.accessCount += 1;
        ticket.decompressionTime = decompressionTime;
        await ticket.save();

        const result = ticket.toObject();
        result.data = decompressedData;

        return res.status(200).json({msg:"success", data: result});
    }catch(error){
        console.log(error)
        return res.status(500).json({msg:"Error Getting Ticket.", error});
    }
}

async function getArchivedTicketById(req, res) {
    try{
        const ticket = await ArchiveTickets.findById(req.params.id);
        if(!ticket){
            return res.status(404).json({msg:"No ticket found!"});
        }
        const [decompressedData, decompressionTime] = await decompressData(ticket)
        // Increment the access count
        ticket.accessCount += 1;
        ticket.decompressionTime = decompressionTime;
        await ticket.save();

        const result = ticket.toObject();
        result.data = decompressedData;

        return res.status(200).json({msg:"success", data: result});
    }catch(error){
        console.log(error)
        return res.status(500).json({msg:"Error Getting Ticket.", error});
    }
}

module.exports = {
    getArchivedTicketByTicketId,
    getArchivedTicketById
  };