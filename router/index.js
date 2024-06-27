const express = require("express");
const asyncify = require("express-asyncify").default;

const router = asyncify(express.Router());

router.use("/login", board);

module.exports = router;