const ArchiveTickets = require("../models/archiveTickets.js");
const lzma = require("lzma");

async function handleCreateLZMATicket(req, res) {
  try {
    const startCompress = process.hrtime();
    lzma.compress(JSON.stringify(req.body), 1, async (result, error) => {
      if (error) {
        return res.status(500).json({ msg: "error compressing data", error });
      }
      const originalData = JSON.stringify(req.body);
      const {ticketID} = req.body;
      const originalSize = Buffer.byteLength(originalData);
      const compressedData = Buffer.from(result);
      const endCompress = process.hrtime(startCompress);
      const compressionTime = endCompress[0] * 1000 + endCompress[1] / 1000000; //Milliseconds

      const compressedSize = compressedData.length;
      const compressionRatio = originalSize / compressedSize;
      
      const startDecompress = process.hrtime();
      lzma.decompress(compressedData, (result, error) => {
        if (error) {
          return res.status(500).json({ msg: "error decompressing data", error });
        }
        const decompressedData = JSON.parse(result.toString());
        //res.status(200).json(decompressedData);
      });
      const endDecompress = process.hrtime(startDecompress);
      const decompressionTime = endDecompress[0] * 1000 + endDecompress[1] / 1000000; // Milliseconds


      await ArchiveTickets.create({
        ticketID,
        data: compressedData,
        compressor: "LZMA",
        originalSize: originalSize,
        compressedSize: compressedSize,
        compressionRatio: compressionRatio,
        compressionTime: compressionTime,
        decompressionTime: decompressionTime
      });
      return res.status(201).json({ msg: "success" });
    });
  } catch (error) {
    return res.status(500).json({ msg: "error creating ticket", error });
  }
}

async function lzmaCompress(data) {
  return new Promise((resolve, reject) => {
    const startCompress = process.hrtime();
    lzma.compress(JSON.stringify(data), 1, (result, error) => {
      if (error) {
        return reject(null);
      }
      const endCompress = process.hrtime(startCompress);
      const originalData = JSON.stringify(data);
      const originalSize = Buffer.byteLength(originalData);
      const compressedData = Buffer.from(result);
      const compressionTime = endCompress[0] * 1000 + endCompress[1] / 1000000; // Milliseconds

      const compressedSize = compressedData.length;
      const compressionRatio = originalSize / compressedSize;
      resolve([compressedData, compressionTime, compressionRatio]);
    });
  });
}

async function lzmaDecompression(ticket) {
  return new Promise((resolve, reject) => {
    const startDecompress = process.hrtime(); 
    lzma.decompress(ticket.data, async (result, error) => {
        if (error) {
            return reject(null);
        }
        const endDecompress = process.hrtime(startDecompress);
        const decompressionTime = endDecompress[0] * 1000 + endDecompress[1] / 1000000; // Milliseconds

        const decompressedData = JSON.parse(result.toString());
        resolve([decompressedData, decompressionTime]);
    });
  });
}

async function handleGetLZMATicketById(req, res) {
  try {
    const ticket = await ArchiveTickets.findById(req.params.id);
    if (ticket) {
      const decompressionResult = await lzmaDecompression(ticket);
      if (!decompressionResult) {
        return res.status(500).json({ msg: "error decompressing data", error });
      }
      const [decompressedData, decompressionTime] = decompressionResult;
      await ArchiveTickets.findByIdAndUpdate(
        { _id: ticket._id },
        { decompressionTime }
    );
    res.status(200).json(decompressedData);
    } else {
      res.status(404).json({ msg: "Ticket not found" });
    }
  } catch (error) {
    res.status(500).json({ msg: "Error retrieving ticket", error });
  }
}

async function handleCreateBulkLZMATickets(req, res) {
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
      const compressedData = await new Promise((resolve, reject) => {
        lzma.compress(originalData, 1, (result, error) => {
          if (error) {
            return reject(error);
          }
          resolve(Buffer.from(result));
        });
      });
      const endCompress = process.hrtime(startCompress);
      const compressionTime = endCompress[0] * 1000 + endCompress[1] / 1000000; //milliseconds

      const compressedSize = compressedData.length;
      const compressionRatio = originalSize / compressedSize;

      totalOriginalSize += originalSize;
      totalCompressionSize += compressedSize;
      totalCompressionTime += compressionTime;
      totalCompressionRatio += compressionRatio;

      const startDecompress = process.hrtime();
      await new Promise((resolve, reject) => {
        lzma.decompress(compressedData, (result, error) => {
          if (error) {
            return reject(error);
          }
          resolve();
        });
      });
      const endDecompress = process.hrtime(startDecompress);
      const decompressionTime = endDecompress[0] * 1000 + endDecompress[1] / 1000000; // milliseconds

      totalDecompressionTime += decompressionTime;

      await ArchiveTickets.create({
        ticketID,
        data: compressedData,
        compressor: "LZMA",
        originalSize: originalSize,
        compressedSize: compressedSize,
        compressionRatio: compressionRatio,
        compressionTime: compressionTime,
        decompressionTime: decompressionTime
      });
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
    return res.status(500).json({ msg: "error creating tickets", error });
  }
}

module.exports = {
  handleCreateLZMATicket,
  handleGetLZMATicketById,
  lzmaDecompression,
  lzmaCompress,
  handleCreateBulkLZMATickets
};
