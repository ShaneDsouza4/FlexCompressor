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

        const algorithmsData = [
            {
                name: "ZSTD",
                totalTickets:allTicketCount,
                tasksCompleted: zstdAggregation[0].count,
                avgCompressionTime: zstdAggregation[0].avgCompressionTime,
                avgCompressionRatio: zstdAggregation[0].avgCompressionRatio
            },
            {
                name: "LZMA",
                totalTickets:allTicketCount,
                tasksCompleted: lzmaAggregation[0].count,
                avgCompressionTime: lzmaAggregation[0].avgCompressionTime,
                avgCompressionRatio: lzmaAggregation[0].avgCompressionRatio
            },
            {
                name: "Brotli",
                totalTickets:allTicketCount,
                tasksCompleted: brotliAggregation[0].count,
                avgCompressionTime: brotliAggregation[0].avgCompressionTime,
                avgCompressionRatio: brotliAggregation[0].avgCompressionRatio
            }
        ]

        algorithmsData.sort((a, b) => {
            if (a.avgCompressionTime === b.avgCompressionTime) {
                return b.avgCompressionRatio - a.avgCompressionRatio;
            }
            return a.avgCompressionTime - b.avgCompressionTime;
        });

        algorithmsData[0].rating = 'Best';
        algorithmsData[1].rating = 'Average';
        algorithmsData[2].rating = 'Worst';
        
        res.status(200).json([
            {
                id: 1,
                name: "ZSTD",
                position: algorithmsData[0].rating,
                totalTickets:allTicketCount,
                tasksCompleted: algorithmsData[0].tasksCompleted,
                avgCompressionTime: round(algorithmsData[0].avgCompressionTime),
                avgCompressionRatio: round(algorithmsData[0].avgCompressionRatio)
            },
            {
                id: 2,
                name: "LZMA",
                position: algorithmsData[1].rating,
                totalTickets:allTicketCount,
                tasksCompleted: algorithmsData[1].tasksCompleted,
                avgCompressionTime: round(algorithmsData[1].avgCompressionTime),
                avgCompressionRatio: round(algorithmsData[1].avgCompressionRatio)
            },
            {
                id: 3,
                name: "Brotli",
                position: algorithmsData[2].rating,
                totalTickets:allTicketCount,
                tasksCompleted: algorithmsData[2].tasksCompleted,
                avgCompressionTime: round(algorithmsData[2].avgCompressionTime),
                avgCompressionRatio: round(algorithmsData[2].avgCompressionRatio)
            }
        ]);
    }catch(error){
        console.log(error);
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
