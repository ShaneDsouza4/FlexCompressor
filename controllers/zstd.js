const ActiveTickets = require("../models/ActiveTickets");
const ArchiveTickets = require("../models/archiveTickets.js");
const zstd = require('@mongodb-js/zstd');
const {compress, decompress} = require("@mongodb-js/zstd");

async function handleCreateZSTDTicket(req, res) {
    try {
      const originalData = JSON.stringify(req.body);
      const originalSize = Buffer.byteLength(originalData);
      const startCompress = process.hrtime();
      const {ticketID} = req.body;
      const compressedData = await zstd.compress(Buffer.from(originalData));
      const endCompress = process.hrtime(startCompress);
      const compressionTime = endCompress[0] * 1000 + endCompress[1] / 1000000; //Milliseconds
      const compressedSize = compressedData.length;
      const compressionRatio = originalSize / compressedSize;

      const startDecompress = process.hrtime();
      const decompressedData = zstd.decompress(compressedData);
      const endDecompress = process.hrtime(startDecompress);
      const decompressionTime = endDecompress[0] * 1000 + endDecompress[1] / 1000000; //Milliseconds

      await ArchiveTickets.create({
        ticketID,
        data: compressedData,
        compressor: "ZSTD",
        originalSize: originalSize,
        compressedSize: compressedSize,
        compressionRatio:compressionRatio,
        compressionTime: compressionTime,
        decompressionTime: decompressionTime
      });

      // Check if the ticket exists in ActiveTickets
      const activeTicket = await ActiveTickets.findOne({ ticketID });
      if (activeTicket) {
          // Delete the ticket from ActiveTickets
          await ActiveTickets.deleteOne({ ticketID });
      }
  
      return res.status(201).json({ msg: "success" });
    } catch (error) {
      //console.log(error);
      return res.status(500).json({ msg: "error creating ZSTD ticket", error });
    }
  }

async function zstdDecompression(ticket) {
  const startDecompress = process.hrtime();
  const decompressedData = await zstd.decompress(ticket.data);
  const endDecompress = process.hrtime(startDecompress);
  const decompressionTime = endDecompress[0] * 1000 + endDecompress[1] / 1000000; // Milliseconds
  return [JSON.parse(decompressedData.toString()), decompressionTime];
}

async function zstdCompress(data) {
  const originalData = JSON.stringify(data);
  const originalSize = Buffer.byteLength(originalData);
  const startCompress = process.hrtime();
  const compressedData = await zstd.compress(Buffer.from(originalData));
  const endCompress = process.hrtime(startCompress);
  const compressionTime = endCompress[0] * 1000 + endCompress[1] / 1000000; // Milliseconds
  const compressedSize = compressedData.length;
  const compressionRatio = originalSize / compressedSize;
  return [compressedData, compressionTime, compressionRatio];
}

async function handleGetZSTDTicketById(req, res) {
    try {
      const ticket = await ArchiveTickets.findById(req.params.id);
      if (ticket) {
        const [decompressedData, decompressionTime] = await zstdDecompression(ticket);
        await ArchiveTickets.findByIdAndUpdate(
          {_id: ticket._id},
          { decompressionTime }
        )
        res.status(200).json(decompressedData);
      } else {
        res.status(404).json({ msg: 'Ticket not found' });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: 'Error retrieving ticket', error });
    }
};

async function handleCreateBulkZSTDTickets(req, res) {
  try {
    const tickets = req.body;
    let totalCompressionSize = 0;
    let totalCompressionTime = 0;
    let totalDecompressionTime = 0;
    let totalOriginalSize = 0;
    let totalCompressionRatio = 0;

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const originalData = JSON.stringify(ticket);
      const originalSize = Buffer.byteLength(originalData);
      const { ticketID } = ticket;

      const startCompress = process.hrtime();
      const compressedData = await zstd.compress(Buffer.from(originalData));
      const endCompress = process.hrtime(startCompress);
      const compressionTime = endCompress[0] * 1000 + endCompress[1] / 1000000; // Milliseconds

      const compressedSize = compressedData.length;
      const compressionRatio = originalSize / compressedSize;

      totalOriginalSize += originalSize;
      totalCompressionSize += compressedSize;
      totalCompressionTime += compressionTime;
      totalCompressionRatio += compressionRatio;

      const startDecompress = process.hrtime();
      const decompressedData = await zstd.decompress(compressedData);
      const endDecompress = process.hrtime(startDecompress);
      const decompressionTime = endDecompress[0] * 1000 + endDecompress[1] / 1000000; // Milliseconds

      totalDecompressionTime += decompressionTime;

      await ArchiveTickets.create({
        ticketID,
        data: compressedData,
        compressor: "ZSTD",
        originalSize: originalSize,
        compressedSize: compressedSize,
        compressionRatio: compressionRatio,
        compressionTime: compressionTime,
        decompressionTime: decompressionTime
      });

      // Check if the ticket exists in ActiveTickets
      const activeTicket = await ActiveTickets.findOne({ ticketID });
      if (activeTicket) {
        // Delete the ticket from ActiveTickets
        await ActiveTickets.deleteOne({ ticketID });
      }
    }

    const avgOriginalSize = totalOriginalSize / tickets.length;
    const avgCompressionSize = totalCompressionSize / tickets.length;
    const avgCompressionTime = totalCompressionTime / tickets.length;
    const avgDecompressionTime = totalDecompressionTime / tickets.length;
    const avgCompressionRatio = totalCompressionRatio / tickets.length;

    return res.status(201).json({
      msg: "success",
      avgOriginalSize,
      avgCompressionSize,
      avgCompressionTime,
      avgDecompressionTime,
      avgCompressionRatio
    });
  } catch (error) {
    return res.status(500).json({ msg: "error creating ZSTD tickets", error });
  }
}

module.exports = {
    handleCreateZSTDTicket,
    handleGetZSTDTicketById,
    zstdDecompression,
    zstdCompress,
    handleCreateBulkZSTDTickets
}