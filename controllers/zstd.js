const ArchiveTickets = require("../models/archiveTickets.js");
const zstd = require('@mongodb-js/zstd');
const {compress, decompress} = require("@mongodb-js/zstd");

async function handleCreateZSTDTicket(req, res) {
    try {
      const originalData = JSON.stringify(req.body);
      const originalSize = Buffer.byteLength(originalData);
      const startCompress = process.hrtime();
      const compressedData = await zstd.compress(Buffer.from(originalData));
      const endCompress = process.hrtime(startCompress);
      const compressionTime = endCompress[0] * 1000 + endCompress[1] / 1000000; // Convert to milliseconds
      const compressedSize = compressedData.length;
      const compressionRatio = originalSize / compressedSize;

      await ArchiveTickets.create({
        data: compressedData,
        compressor: "ZSTD",
        originalSize: originalSize,
        compressedSize: compressedSize,
        compressionRatio:compressionRatio,
        compressionTime: compressionTime
      });
  
      return res.status(201).json({ msg: "success" });
    } catch (error) {
      return res.status(500).json({ msg: "error creating ZSTD ticket", error });
    }
  }


async function handleGetZSTDTicketById(req, res) {
    try {
      const ticket = await ArchiveTickets.findById(req.params.id);
      if (ticket) {
        const startDecompress = process.hrtime();
        const decompressedData = await zstd.decompress(ticket.data);
        const endDecompress = process.hrtime(startDecompress);
        decompressionTime = endDecompress[0] * 1000 + endDecompress[1] / 1000000; // Convert to milliseconds
        await ArchiveTickets.findByIdAndUpdate(
          {_id: ticket._id},
          { decompressionTime }
        )
        res.status(200).json(JSON.parse(decompressedData.toString()));
      } else {
        res.status(404).json({ msg: 'Ticket not found' });
      }
    } catch (error) {
      res.status(500).json({ msg: 'Error retrieving ticket', error });
    }
};


module.exports = {
    handleCreateZSTDTicket,
    handleGetZSTDTicketById
}