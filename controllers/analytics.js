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
                    avgCompressionRatio: { $avg: "$compressionRatio" },
                    avgDecompressionTime: { $avg: "$decompressionTime" },
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
                    avgCompressionRatio: { $avg: "$compressionRatio" },
                    avgDecompressionTime: { $avg: "$decompressionTime" },
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
                    avgCompressionRatio: { $avg: "$compressionRatio" },
                    avgDecompressionTime: { $avg: "$decompressionTime" },
                }
            }
        ]);

        const round = (value) => Math.round(value * 1000) / 1000;

        const algorithmsData = [
            {
                name: "ZSTD",
                totalTickets: allTicketCount,
                tasksCompleted: zstdAggregation.length ? zstdAggregation[0].count : 0,
                avgCompressionTime: zstdAggregation.length ? round(zstdAggregation[0].avgCompressionTime) : 0,
                avgCompressionRatio: zstdAggregation.length ? round(zstdAggregation[0].avgCompressionRatio) : 0,
                avgDecompressionTime: zstdAggregation.length ? round(zstdAggregation[0].avgDecompressionTime) : 0,
            },
            {
                name: "LZMA",
                totalTickets: allTicketCount,
                tasksCompleted: lzmaAggregation.length ? lzmaAggregation[0].count : 0,
                avgCompressionTime: lzmaAggregation.length ? round(lzmaAggregation[0].avgCompressionTime) : 0,
                avgCompressionRatio: lzmaAggregation.length ? round(lzmaAggregation[0].avgCompressionRatio) : 0,
                avgDecompressionTime: lzmaAggregation.length ? round(lzmaAggregation[0].avgDecompressionTime) : 0,
            },
            {
                name: "Brotli",
                totalTickets: allTicketCount,
                tasksCompleted: brotliAggregation.length ? brotliAggregation[0].count : 0,
                avgCompressionTime: brotliAggregation.length ? round(brotliAggregation[0].avgCompressionTime) : 0,
                avgCompressionRatio: brotliAggregation.length ? round(brotliAggregation[0].avgCompressionRatio) : 0,
                avgDecompressionTime: brotliAggregation.length ? round(brotliAggregation[0].avgDecompressionTime) : 0,
            }
        ]

        //console.log(algorithmsData);

        // Sort by avgDecompressionTime (ascending) and then by avgCompressionRatio (descending)
        algorithmsData.sort((a, b) => {
            if (a.avgDecompressionTime === b.avgDecompressionTime) {
                return b.avgCompressionRatio - a.avgCompressionRatio;
            }
            return a.avgDecompressionTime - b.avgDecompressionTime;
        });

        algorithmsData[0].rating = 'Best';
        algorithmsData[1].rating = 'Average';
        algorithmsData[2].rating = 'Worst';
        
        res.status(200).json({
            LZMA: algorithmsData.find(algo => algo.name === 'LZMA'),
            ZSTD: algorithmsData.find(algo => algo.name === 'ZSTD'),
            Brotli: algorithmsData.find(algo => algo.name === 'Brotli')
        });
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
            percentageSaved: Math.round(percentageSaved * 100) / 100 //2 decimal places
        });
    } else {
        res.status(200).json({
            totalOriginalSize: 0,
            totalCompressedSize: 0,
            percentageSaved: 0
        });
    }
}

async function handleMonthlyCompressionStats(req, res){
    try {
        const stats = await archiveTickets.aggregate([
            {
                $project: {
                    yearMonth: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    compressionRatio: 1,
                    compressionTime: 1,
                    decompressionTime: 1
                }
            },
            {
                $group: {
                    _id: "$yearMonth",
                    avgCompressionRatio: { $avg: "$compressionRatio" },
                    avgCompressionTime: { $avg: "$compressionTime" },
                    avgDecompressionTime: { $avg: "$decompressionTime" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const roundedStats = stats.map(stat => ({
            _id: stat._id,
            avgCompressionRatio: Math.round(stat.avgCompressionRatio * 100) / 100,
            avgCompressionTime: Math.round(stat.avgCompressionTime * 100) / 100,
            avgDecompressionTime: Math.round(stat.avgDecompressionTime * 100) / 100
        }));

        res.status(200).json({ msg: "success", monthlyStats:roundedStats });
    } catch (error) {
        res.status(500).json({ msg: "Error getting compression stats", error });
    }
}

module.exports = {
    handleGetAlgoCountTimeRatio,
    handleGetBothCollectionCount,
    getCompressionStats,
    handleMonthlyCompressionStats
}
