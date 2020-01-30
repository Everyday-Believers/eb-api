const express = require("express");
const router = express.Router();

/**
 * get server status
 */
router.all("/ping", (req, res) => {
	return res.status(200).json({status: "ok"});
});

/**
 * and more ...
 */

module.exports = router;
