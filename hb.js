var express = require("express");
var router = express.Router();

router.get("/hb", function (_, res) {
  res.json({ message: "auth-service running" });
});

module.exports = router;
