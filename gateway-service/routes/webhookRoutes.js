const express = require('express');
const { verifyWebhook, receiveWebhook } = require('../controllers/webhookController');
const { normalizePayload } = require('../controllers/payloadNormalizerController');

const router = express.Router();

router.get('/', verifyWebhook);
router.post('/', receiveWebhook);
router.post('/normalize', normalizePayload);

module.exports = router;
