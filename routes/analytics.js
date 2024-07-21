const express = require("express");
const router = express.Router();

const { 
    handleGetAlgoCountTimeRatio,
    handleGetBothCollectionCount
 } = require("../controllers/analytics");

router.get("/GetAlgoDetails", handleGetAlgoCountTimeRatio);
router.get("/handleGetBothCollectionCount", handleGetBothCollectionCount);

module.exports = router;
