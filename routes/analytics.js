const express = require("express");
const router = express.Router();

const { 
    handleGetAlgoCountTimeRatio,
    handleGetBothCollectionCount,
    getCompressionStats
 } = require("../controllers/analytics");

router.get("/GetAlgoDetails", handleGetAlgoCountTimeRatio);
router.get("/handleGetBothCollectionCount", handleGetBothCollectionCount);
router.get("/getCompressionStats", getCompressionStats);

module.exports = router;
