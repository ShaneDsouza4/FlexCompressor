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
      const compressionTime = endCompress[0] * 1000 + endCompress[1] / 1000000; // Convert to milliseconds
      const compressedSize = compressedData.length;
      const compressionRatio = originalSize / compressedSize;

      // Decompress the data to measure decompression time
      const startDecompress = process.hrtime();
      const decompressedData = zstd.decompress(compressedData);
      const endDecompress = process.hrtime(startDecompress);
      const decompressionTime = endDecompress[0] * 1000 + endDecompress[1] / 1000000; // Convert to milliseconds

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
  
      return res.status(201).json({ msg: "success" });
    } catch (error) {
      return res.status(500).json({ msg: "error creating ZSTD ticket", error });
    }
  }

async function zstdDecompression(ticket) {
  const startDecompress = process.hrtime();
  const decompressedData = await zstd.decompress(ticket.data);
  const endDecompress = process.hrtime(startDecompress);
  const decompressionTime = endDecompress[0] * 1000 + endDecompress[1] / 1000000; // Convert to milliseconds
  return [JSON.parse(decompressedData.toString()), decompressionTime];
}

async function zstdCompress(data) {
  const originalData = JSON.stringify(data);
  const originalSize = Buffer.byteLength(originalData);
  const startCompress = process.hrtime();
  const compressedData = await zstd.compress(Buffer.from(originalData));
  const endCompress = process.hrtime(startCompress);
  const compressionTime = endCompress[0] * 1000 + endCompress[1] / 1000000; // Convert to milliseconds
  const compressedSize = compressedData.length;
  const compressionRatio = originalSize / compressedSize;
  return [compressedData, compressionTime, compressionRatio];;
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


module.exports = {
    handleCreateZSTDTicket,
    handleGetZSTDTicketById,
    zstdDecompression,
    zstdCompress
}