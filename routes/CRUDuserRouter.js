const router = require("express").Router();
const CRUDuserCtrl = require("../controllers/CURDuserControl");
require("dotenv").config();
const { authenticateToken } = require("#middlewares");
const multer = require("multer");
const upload = multer({ dest: "files/img_user/" });

router.get("/users", authenticateToken, CRUDuserCtrl.getUsers);
router.get("/users/:id", authenticateToken, CRUDuserCtrl.getUsersById);
router.get("/usersincompany", authenticateToken, CRUDuserCtrl.getUserEmployee);
router.get("/team/:idpartner", authenticateToken, CRUDuserCtrl.getUserOfTeam);
router.get("/client", authenticateToken, CRUDuserCtrl.getUserClient);
router.get("/partner", authenticateToken, CRUDuserCtrl.getUserPartner);
router.get(
	"/user/notifications",
	authenticateToken,
	CRUDuserCtrl.getNotificationsByUserId
);

router.get(
	"/user/internalNotifications",
	authenticateToken,
	CRUDuserCtrl.getInternalNotificationsByUserId
);

router.get(
	"/user/assignedToMe",
	authenticateToken,
	CRUDuserCtrl.getAssignedToMe
);

router.post("/searchclient", authenticateToken, CRUDuserCtrl.searchClient);
router.post("/createEmployee", authenticateToken, CRUDuserCtrl.addEmployee);
router.post("/searchemployee", authenticateToken, CRUDuserCtrl.searchEmployee);

router.post(
	"/importUsers",
	authenticateToken,
	upload.single("file"),
	CRUDuserCtrl.importUsers
);

router.post("/firTokenPost", authenticateToken, CRUDuserCtrl.firTokenPost);
router.get("/cleanDuplicateFirToken", CRUDuserCtrl.cleanDuplicateFirToken);

router.patch("/users/:id/edit", authenticateToken, CRUDuserCtrl.updateUSers);

router.patch(
	"/user/editavatar",
	authenticateToken,
	upload.single("file"),
	CRUDuserCtrl.updateAvatar
);
router.get(
	"/notification/:idNoty/updateSeen",
	authenticateToken,
	CRUDuserCtrl.updateNotySeen
);

router.get(
	"/internalnotification/:idNoty/updateSeen",
	authenticateToken,
	CRUDuserCtrl.updateInternalNotySeen
);

router.get(
	"/checkIfPasswordExpires",
	authenticateToken,
	CRUDuserCtrl.checkIfThePasswordExpired
);

router.delete("/users/:id", authenticateToken, CRUDuserCtrl.deleteUsers);
router.post(
	"/users/resetpassword",
	authenticateToken,
	CRUDuserCtrl.ResetPassword
);
router.post("/users/forgotpassword", CRUDuserCtrl.ConfirmResetPassword);

router.put(
	"/users/changePassword",
	authenticateToken,
	CRUDuserCtrl.changePassword
);

module.exports = router;
