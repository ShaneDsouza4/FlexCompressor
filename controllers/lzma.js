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
      const compressionTime = endCompress[0] * 1000 + endCompress[1] / 1000000; // Convert to milliseconds

      const compressedSize = compressedData.length;
      const compressionRatio = originalSize / compressedSize;
      

      await ArchiveTickets.create({
        ticketID,
        data: compressedData,
        compressor: "LZMA",
        originalSize: originalSize,
        compressedSize: compressedSize,
        compressionRatio: compressionRatio,
        compressionTime: compressionTime
      });
      return res.status(201).json({ msg: "success" });
    });
  } catch (error) {
    return res.status(500).json({ msg: "error creating ticket", error });
  }
}

async function lzmaDecompression(ticket) {
  return new Promise((resolve, reject) => {
    const startDecompress = process.hrtime(); // Record start time
    lzma.decompress(ticket.data, async (result, error) => {
        if (error) {
            return reject(null);
        }
        const endDecompress = process.hrtime(startDecompress);
        const decompressionTime = endDecompress[0] * 1000 + endDecompress[1] / 1000000; // Convert to milliseconds

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

module.exports = {
  handleCreateLZMATicket,
  handleGetLZMATicketById,
  lzmaDecompression
};
