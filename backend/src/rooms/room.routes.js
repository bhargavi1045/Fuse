const express = require('express');
const { requireAuth } = require('../auth/auth.middleware');
const {
  createRoomHandler,
  listRoomsHandler,
  getRoomHandler,
} = require('./room.controller');

const router = express.Router();

router.post('/', requireAuth, createRoomHandler);
router.get('/', requireAuth, listRoomsHandler);
router.get('/:roomId', requireAuth, getRoomHandler);

module.exports = router;
