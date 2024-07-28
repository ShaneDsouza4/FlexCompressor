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
        const compressionTime = endCompress[0] * 1000 + endCompress[1] / 1000000; //milliseconds
        const compressedSize = compressedData.length;
        const compressionRatio = originalSize / compressedSize;

        const startDecompress = process.hrtime();
        const decompressedData = brotli.decompress(compressedData);
        const endDecompress = process.hrtime(startDecompress);
        const decompressionTime = endDecompress[0] * 1000 + endDecompress[1] / 1000000; // milliseconds

        await ArchiveTickets.create({
            ticketID,
            data: compressedData,
            compressor: "Brotli",
            originalSize: originalSize,
            compressedSize: compressedSize,
            compressionRatio: compressionRatio,
            compressionTime: compressionTime,
            decompressionTime: decompressionTime
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
    const compressionTime = endCompress[0] * 1000 + endCompress[1] / 1000000; // milliseconds
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
  let decompressionTime = endDecompress[0] * 1000 + endDecompress[1] / 1000000; // milliseconds
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

async function handleCreateBulkBrotliTicket(req, res) {
    try {
        const tickets = req.body; 

        let totalOriginalSize = 0;
        let totalCompressedSize = 0;
        let totalCompressionTime = 0;
        let totalDecompressionTime = 0;
        let totalCompressionRatio = 0;

        const archivePromises = tickets.map(async (ticket) => {
            const originalData = JSON.stringify(ticket);
            const originalSize = Buffer.byteLength(originalData);
            totalOriginalSize += originalSize;

            const startCompress = process.hrtime();
            const compressedData = Buffer.from(brotli.compress(Buffer.from(originalData)));
            const endCompress = process.hrtime(startCompress);
            const compressionTime = endCompress[0] * 1000 + endCompress[1] / 1000000; // milliseconds
            totalCompressionTime += compressionTime;

            const compressedSize = compressedData.length;
            totalCompressedSize += compressedSize;
            const compressionRatio = originalSize / compressedSize;
            totalCompressionRatio += compressionRatio;

            const startDecompress = process.hrtime();
            const decompressedData = brotli.decompress(compressedData);
            const endDecompress = process.hrtime(startDecompress);
            const decompressionTime = endDecompress[0] * 1000 + endDecompress[1] / 1000000; // milliseconds
            totalDecompressionTime += decompressionTime;

            return ArchiveTickets.create({
                ticketID: ticket.ticketID,
                data: compressedData,
                compressor: "Brotli",
                originalSize: originalSize,
                compressedSize: compressedSize,
                compressionRatio: compressionRatio,
                compressionTime: compressionTime,
                decompressionTime: decompressionTime
            });
        });

        await Promise.all(archivePromises);

        const avgOriginalSize = totalOriginalSize / tickets.length;
        const avgCompressedSize = totalCompressedSize / tickets.length;
        const avgCompressionTime = totalCompressionTime / tickets.length;
        const avgDecompressionTime = totalDecompressionTime / tickets.length;
        const avgCompressionRatio = totalCompressionRatio / tickets.length;

        return res.status(201).json({
            msg: "success",
            avgOriginalSize: avgOriginalSize,
            avgCompressedSize: avgCompressedSize,
            avgCompressionTime: avgCompressionTime,
            avgDecompressionTime: avgDecompressionTime,
            avgCompressionRatio: avgCompressionRatio
        });
    } catch (error) {
        return res.status(500).json({ msg: "error creating tickets", error });
    }
}

module.exports = {
    handleCreateBrotliTicket,
    handleGetBrotliTicketById,
    handleCreateBulkBrotliTicket,
    brotliDecompression,
    brotliCompress
}