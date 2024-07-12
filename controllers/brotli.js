const TICKET = require("../models/tickets");
const brotli = require("brotli");

async function handleCreateBrotliTicket(req, res){
    try{
        const originalData = JSON.stringify(req.body);
        const originalSize = Buffer.byteLength(originalData);
        const compressedData = Buffer.from(brotli.compress(Buffer.from(JSON.stringify(req.body))));
        const compressedSize = compressedData.length;
        const compressionRatio = originalSize / compressedSize;
        await TICKET.create({
            data: compressedData,
            compressor: "Brotli",
            originalSize: originalSize,
            compressedSize: compressedSize,
            compressionRatio: compressionRatio
        })
        return res.status(201).json({msg:"success"});
    }catch(error){
        return res.status(500).json({msg:"error creating ticket", error});
    }
}


async function handleGetBrotliTicketById(req, res){
    try{
        const ticket = await TICKET.findById(req.params.id);
        if (ticket) {
            const decompressedData = JSON.parse(Buffer.from(brotli.decompress(ticket.data)).toString());
            res.status(200).json({msg:"success", decompressedData});
        } else {
            res.status(404).json({ msg: 'Ticket not found' });
        }
    }catch(error){
        return res.status(500).json({msg:"error getting ticket", error});
    }
}

module.exports = {
    handleCreateBrotliTicket,
    handleGetBrotliTicketById
}