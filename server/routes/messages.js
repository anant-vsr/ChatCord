const router = require("express").Router();
const { catchErrors } = require("../handlers/errorHandler");
const messagesController = require("../controllers/messagesController");

const auth = require("../middlewares/auth");

router.get(
  "/:channelId",
  auth,
  catchErrors(messagesController.getAllMessagesInRoom)
);

module.exports = router;
