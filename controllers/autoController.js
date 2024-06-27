const express = require('express');
const authService = require('../services/authService');

const router = express.Router();

router.get('/login', (req, res) => {
  authService.renderLoginPage(req, res);
});

router.post('/login', (req, res) => {
  authService.loginUser(req, res);
});

router.get('/register', (req, res) => {
  authService.renderRegisterPage(req, res);
});

router.post('/register', (req, res) => {
  authService.registerUser(req, res);
});

router.get('/logout', (req, res) => {
  authService.logoutUser(req, res);
});

module.exports = router;
