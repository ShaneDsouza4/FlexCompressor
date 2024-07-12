const TICKET = require("../models/tickets");
const lzma = require("lzma");

async function handleCreateLZMATicket(req, res) {
  try {
    const startCompress = process.hrtime();
    lzma.compress(JSON.stringify(req.body), 1, async (result, error) => {
      if (error) {
        return res.status(500).json({ msg: "error compressing data", error });
      }
      const originalData = JSON.stringify(req.body);
      const originalSize = Buffer.byteLength(originalData);
      const compressedData = Buffer.from(result);
      const endCompress = process.hrtime(startCompress);
      const compressionTime = endCompress[0] * 1000 + endCompress[1] / 1000000; // Convert to milliseconds

      const compressedSize = compressedData.length;
      const compressionRatio = originalSize / compressedSize;
      

      await TICKET.create({
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

async function handleGetLZMATicketById(req, res) {
  try {
    const ticket = await TICKET.findById(req.params.id);
    if (ticket) {
      const startDecompress = process.hrtime();
      lzma.decompress(ticket.data, async (result, error) => {
        if (error) {
          return res
            .status(500)
            .json({ msg: "error decompressing data", error });
        }
        const endDecompress = process.hrtime(startDecompress);
        decompressionTime = endDecompress[0] * 1000 + endDecompress[1] / 1000000; // Convert to milliseconds
        await TICKET.findByIdAndUpdate(
          {_id: ticket._id},
          { decompressionTime }
        )
        const decompressedData = JSON.parse(result.toString());
        res.status(200).json(decompressedData);
      });
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
};
