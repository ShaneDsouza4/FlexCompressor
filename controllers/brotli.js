const ArchiveTickets = require("../models/archiveTickets.js");
const brotli = require("brotli");

async function handleCreateBrotliTicket(req, res){
    try{
        const originalData = JSON.stringify(req.body);
        const originalSize = Buffer.byteLength(originalData);
        const startCompress = process.hrtime();
        const {ticketID} = req.body;
        const compressedData = Buffer.from(brotli.compress(Buffer.from(JSON.stringify(req.body))));
        const endCompress = process.hrtime(startCompress);
        const compressionTime = endCompress[0] * 1000 + endCompress[1] / 1000000; // Convert to milliseconds
        const compressedSize = compressedData.length;
        const compressionRatio = originalSize / compressedSize;
        await ArchiveTickets.create({
            ticketID,
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

function brotliCompress(data) {
    const originalData = JSON.stringify(data);
    const originalSize = Buffer.byteLength(originalData);
    const startCompress = process.hrtime();
    const compressedData = Buffer.from(brotli.compress(Buffer.from(JSON.stringify(data))));
    const endCompress = process.hrtime(startCompress);
    const compressionTime = endCompress[0] * 1000 + endCompress[1] / 1000000; // Convert to milliseconds
    const compressedSize = compressedData.length;
    const compressionRatio = originalSize / compressedSize;
    return [compressedData, compressionTime, compressionRatio];
}

function brotliDecompression(ticket) {
  const startDecompress = process.hrtime();
  const decompressedData = JSON.parse(
    Buffer.from(brotli.decompress(ticket.data)).toString()
  );
  const endDecompress = process.hrtime(startDecompress);
  let decompressionTime = endDecompress[0] * 1000 + endDecompress[1] / 1000000; // Convert to milliseconds
  return [decompressedData, decompressionTime];
}

async function handleGetBrotliTicketById(req, res){
    try{
        let ticket = await ArchiveTickets.findById(req.params.id);
        if (ticket) {
            const [decompressedData, decompressionTime] = brotliDecompression(ticket);
            await ArchiveTickets.findByIdAndUpdate(
              {_id: ticket._id},
              { decompressionTime }
            )
            res.status(200).json({msg:"success", decompressedData});
        } else {
            res.status(404).json({ msg: 'Ticket not found' });
        }
    }catch(error){
        console.log(error);
        return res.status(500).json({msg:"error getting ticket", error});
    }
}

// POST route to add multiple documents
async function handleCreateBulkBrotliTicket(req, res) {
    try {
     
    } catch (error) {
    }
  }


module.exports = {
    handleCreateBrotliTicket,
    handleGetBrotliTicketById,
    handleCreateBulkBrotliTicket,
    brotliDecompression,
    brotliCompress
}