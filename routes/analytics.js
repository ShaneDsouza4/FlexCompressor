const express = require("express");
const router = express.Router();

// Analytics Controller
const { 
    handleGetAlgoCountTimeRatio,
    handleGetBothCollectionCount,
    getCompressionStats,
    handleMonthlyCompressionStats
 } = require("../controllers/analytics");

// Analytics Routes
router.get("/GetAlgoDetails", handleGetAlgoCountTimeRatio);
router.get("/handleGetBothCollectionCount", handleGetBothCollectionCount);
router.get("/getCompressionStats", getCompressionStats);
router.get("/monthlyCompressionStats", handleMonthlyCompressionStats)

module.exports = router;
