const archiveTickets = require("../models/archiveTickets.js");

async function handleGetAlgoCounts(req, res){
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

module.exports = {
    handleGetAlgoCounts
}
