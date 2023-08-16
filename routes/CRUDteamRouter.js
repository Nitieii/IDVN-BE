const router = require("express").Router();
const CURDteamControl = require("../controllers/CURDteamControl");
const { authenticateToken } = require("#middlewares");
require("dotenv").config();

router.get("/teams", authenticateToken, CURDteamControl.getTeams);
router.get("/teams/:id", authenticateToken, CURDteamControl.getTeamById);

router.post(
	"/team/analysis",
	authenticateToken,
	CURDteamControl.getTeamAnalysis
);

router.post(
	"/team/:id/matterAnalysis",
	authenticateToken,
	CURDteamControl.mattersTeamAnalysis
);

router.post(
	"/team/:id/matterOverviewAnalysis",
	authenticateToken,
	CURDteamControl.overviewMattersTeamAnalysis
);

router.post("/team/create", authenticateToken, CURDteamControl.createTeam);
router.patch("/team/:id/edit", authenticateToken, CURDteamControl.editTeam);

router.delete(
	"/team/:id/delete",
	authenticateToken,
	CURDteamControl.deleteTeam
);

module.exports = router;
