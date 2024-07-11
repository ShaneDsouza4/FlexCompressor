const TICKET = require("../models/tickets");
const zstd = require('@mongodb-js/zstd');
const {compress, decompress} = require("@mongodb-js/zstd");

async function handleCreateZSTDTicket(req, res) {
    try {
      const originalData = JSON.stringify(req.body);
      const originalSize = Buffer.byteLength(originalData);
      const compressedData = await zstd.compress(Buffer.from(originalData));
      const compressedSize = compressedData.length;
  
      await TICKET.create({
        data: compressedData,
        compressor: "ZSTD",
        originalSize: originalSize,
        compressedSize: compressedSize
      });
  
      return res.status(201).json({ msg: "success" });
    } catch (error) {
      return res.status(500).json({ msg: "error creating ZSTD ticket", error });
    }
  }


async function handleGetZSTDTicketById(req, res) {
    try {
      const ticket = await TICKET.findById(req.params.id);
      if (ticket) {
        const decompressedData = await zstd.decompress(ticket.data);
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