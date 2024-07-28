const { differenceInWeeks, format } = require('date-fns');

const ArchiveTickets = require("../models/archiveTickets.js");
const {brotliDecompression, brotliCompress} = require("./brotli.js")
const {lzmaDecompression, lzmaCompress} = require("./lzma.js")
const {zstdDecompression, zstdCompress} = require("./zstd.js")


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

function calculateAccessesPerWeek(createdDate, totalAccesses = 0) {
    const createdDateParsed = new Date(createdDate);
    const now = new Date();
    const weeksSinceCreation = differenceInWeeks(now, createdDateParsed);


    if (weeksSinceCreation < 1) {
        return totalAccesses; 
    }

    const accessesPerWeek = totalAccesses / weeksSinceCreation;
    return accessesPerWeek;
}

async function recompressArchived() {
    try{
        const tickets = await ArchiveTickets.find({});
        if(!tickets || !tickets.length){
            return res.status(404).json({ msg: "No tickets found" });
        }

        await Promise.all(tickets.map(async (ticket) => {
            const accessPerWeek = calculateAccessesPerWeek(ticket.createdAt, ticket.accessCount);
            let recompress = false;

            // high CR low Speed - LZMA
            if(accessPerWeek < 2) {
                if(ticket.compressor !== 'LZMA') {
                    const [decompressedData, ] = await decompressData(ticket);
                    const [compressedData, compressionTime, compressionRatio] = await lzmaCompress(decompressedData);
                    ticket.data = compressedData;
                    ticket.compressionTime = compressionTime;
                    ticket.compressionRatio = compressionRatio;
                    ticket.compressedSize = ticket.originalSize / compressionRatio;
                    ticket.compressor = 'LZMA';
                    const [, decompressionTime] = await decompressData(ticket);
                    ticket.decompressionTime = decompressionTime;
                    recompress = true;
                }
            }

            // Medium - Brotli
            else if(accessPerWeek < 10) {
                if(ticket.compressor !== 'Brotli') {
                    const [decompressedData, ] = await decompressData(ticket);
                    const [compressedData, compressionTime, compressionRatio] = await brotliCompress(decompressedData);
                    ticket.data = compressedData;
                    ticket.compressionTime = compressionTime;
                    ticket.compressionRatio = compressionRatio;
                    ticket.compressedSize = ticket.originalSize / compressionRatio;
                    ticket.compressor = 'Brotli';
                    const [, decompressionTime] = await decompressData(ticket);
                    ticket.decompressionTime = decompressionTime;
                    recompress = true;
                }
            }

            // low CR High speed - ZSTD
            else if(ticket.compressor !== 'ZSTD') {
                const [decompressedData, ] = await decompressData(ticket);
                const [compressedData, compressionTime, compressionRatio] = await zstdCompress(decompressedData);
                ticket.data = compressedData;
                ticket.compressionTime = compressionTime;
                ticket.compressionRatio = compressionRatio;
                ticket.compressedSize = ticket.originalSize / compressionRatio;
                ticket.compressor = 'ZSTD';
                const [, decompressionTime] = await decompressData(ticket);
                ticket.decompressionTime = decompressionTime;
                recompress = true;
            }

            if(recompress){
            await ticket.save();}
        }));

    }catch(error){
        console.log("recompress Error");
        console.log(error);
    }
}

module.exports = {
    getArchivedTicketByTicketId,
    getArchivedTicketById,
    recompressArchived
  };