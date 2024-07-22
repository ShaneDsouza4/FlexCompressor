const activeTickets = require("../models/ActiveTickets");
const archiveTickets = require("../models/archiveTickets");

async function handleGetAlgoCountTimeRatio(req, res){
    try{
        const allTicketCount = await archiveTickets.countDocuments({});

        const lzmaAggregation = await archiveTickets.aggregate([
            { $match: { compressor: 'LZMA' } },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    avgCompressionTime: { $avg: "$compressionTime" },
                    avgCompressionRatio: { $avg: "$compressionRatio" }
                }
            }
        ]);

        const zstdAggregation = await archiveTickets.aggregate([
            { $match: { compressor: 'ZSTD' } },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    avgCompressionTime: { $avg: "$compressionTime" },
                    avgCompressionRatio: { $avg: "$compressionRatio" }
                }
            }
        ]);

        const brotliAggregation = await archiveTickets.aggregate([
            { $match: { compressor: 'Brotli' } },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    avgCompressionTime: { $avg: "$compressionTime" },
                    avgCompressionRatio: { $avg: "$compressionRatio" }
                }
            }
        ]);

        const round = (value) => Math.round(value * 1000) / 1000;
        
        res.status(200).json([
            {
                id: 1,
                name: "ZSTD",
                position: "Best Compression",
                totalTickets:allTicketCount,
                tasksCompleted: zstdAggregation[0].count,
                avgCompressionTime: round(zstdAggregation[0].avgCompressionTime),
                avgCompressionRatio: round(zstdAggregation[0].avgCompressionRatio)
            },
            {
                id: 2,
                name: "LZMA",
                position: "Average Compression",
                totalTickets:allTicketCount,
                tasksCompleted: lzmaAggregation[0].count,
                avgCompressionTime: round(lzmaAggregation[0].avgCompressionTime),
                avgCompressionRatio: round(lzmaAggregation[0].avgCompressionRatio)
            },
            {
                id: 3,
                name: "Brotli",
                position: "Worst Compression",
                totalTickets:allTicketCount,
                tasksCompleted: brotliAggregation[0].count,
                avgCompressionTime: round(brotliAggregation[0].avgCompressionTime),
                avgCompressionRatio: round(brotliAggregation[0].avgCompressionRatio)
            }
        ]);
    }catch(error){
        res.status(500).json({ msg: 'Error getting compression counts', error });
    }
}

async function handleGetBothCollectionCount(req, res){
    try{
        const totalTicket = await activeTickets.countDocuments({});
        const totalArchiveTickets = await archiveTickets.countDocuments({});
        return res.status(200).json({totalTicket, totalArchiveTickets});
    }catch(error){
        res.status(500).json({ msg: 'Error getting compression counts', error });
    }
}

async function getCompressionStats(req, res){
    const aggregation = await archiveTickets.aggregate([
        {
            $group: {
                _id: null,
                totalOriginalSize: { $sum: "$originalSize" },
                totalCompressedSize: { $sum: "$compressedSize" }
            }
        }
    ]);

    if (aggregation.length > 0) {
        const { totalOriginalSize, totalCompressedSize } = aggregation[0];
        const percentageSaved = ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100;

        res.status(200).json({
            totalOriginalSize,
            totalCompressedSize,
            percentageSaved: Math.round(percentageSaved * 100) / 100 // Round to 2 decimal places
        });
    } else {
        res.status(200).json({
            totalOriginalSize: 0,
            totalCompressedSize: 0,
            percentageSaved: 0
        });
    }
}

module.exports = {
    handleGetAlgoCountTimeRatio,
    handleGetBothCollectionCount,
    getCompressionStats
}
