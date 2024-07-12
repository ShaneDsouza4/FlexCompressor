const TICKET = require("../models/tickets");
const brotli = require("brotli");

async function handleCreateBrotliTicket(req, res){
    try{
        const originalData = JSON.stringify(req.body);
        const originalSize = Buffer.byteLength(originalData);
        const startCompress = process.hrtime();
        const compressedData = Buffer.from(brotli.compress(Buffer.from(JSON.stringify(req.body))));
        const endCompress = process.hrtime(startCompress);
        const compressionTime = endCompress[0] * 1000 + endCompress[1] / 1000000; // Convert to milliseconds
        const compressedSize = compressedData.length;
        const compressionRatio = originalSize / compressedSize;
        await TICKET.create({
            data: compressedData,
            compressor: "Brotli",
            originalSize: originalSize,
            compressedSize: compressedSize,
            compressionRatio: compressionRatio,
            compressionTime: compressionTime
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
            const startDecompress = process.hrtime();
            const decompressedData = JSON.parse(Buffer.from(brotli.decompress(ticket.data)).toString());
            const endDecompress = process.hrtime(startDecompress);
            decompressionTime = endDecompress[0] * 1000 + endDecompress[1] / 1000000; // Convert to milliseconds
            await TICKET.findByIdAndUpdate(
              {_id: ticket._id},
              { decompressionTime }
            )
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