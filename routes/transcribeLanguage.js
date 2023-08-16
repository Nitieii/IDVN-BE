const router = require("express").Router();
const transcribeLanguage = require("../controllers/transcribe/transcribeAudio");
require("dotenv").config();

router.post("/onelanguagetranscribe", transcribeLanguage.oneLanguageTranscribe);
module.exports = router;
