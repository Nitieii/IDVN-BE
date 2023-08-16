const router = require("express").Router();
const CRUDmessageCtrl = require("../../controllers/ChatRoom/messageControl");
require("dotenv").config();
const { authenticateToken } = require("#middlewares");

router.get(
	"/projects/:idproject/messages",
	authenticateToken,
	CRUDmessageCtrl.getMessages
);
router.post(
	"/projects/:idproject/message/create",
	authenticateToken,
	CRUDmessageCtrl.addMessage
);
router.delete(
	"/projects/:idproject/message/:idmessage/delete",
	authenticateToken,
	CRUDmessageCtrl.deleteMessage
);

module.exports = router;
