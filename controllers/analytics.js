const archiveTickets = require("../models/archiveTickets.js");

async function handleGetAlgoCounts(req, res){
    try{
        const lzmaCount = await archiveTickets.countDocuments({ compressor: 'LZMA' });
        const zstdCount = await archiveTickets.countDocuments({ compressor: 'ZSTD' });
        const brotliCount = await archiveTickets.countDocuments({ compressor: 'Brotli' });

        res.status(200).json({
            LZMA: lzmaCount,
            Zstandard: zstdCount,
            Brotli: brotliCount
        });
    }catch(error){
        res.status(500).json({ msg: 'Error getting compression counts', error });
    }
}

module.exports = {
    handleGetAlgoCounts
}
