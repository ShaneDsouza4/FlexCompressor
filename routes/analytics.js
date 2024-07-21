const express = require("express");
const router = express.Router();

const { handleGetAlgoCounts } = require("../controllers/analytics");

router.get("/getAlgoCount", handleGetAlgoCounts);

module.exports = router;
