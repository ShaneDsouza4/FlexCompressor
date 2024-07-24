const express = require("express");
const router = express.Router();

const { 
    handleGetAlgoCountTimeRatio,
    handleGetBothCollectionCount,
    getCompressionStats,
    handleMonthlyCompressionStats
 } = require("../controllers/analytics");

router.get("/GetAlgoDetails", handleGetAlgoCountTimeRatio);
router.get("/handleGetBothCollectionCount", handleGetBothCollectionCount);
router.get("/getCompressionStats", getCompressionStats);
router.get("/monthlyCompressionStats", handleMonthlyCompressionStats)

module.exports = router;
