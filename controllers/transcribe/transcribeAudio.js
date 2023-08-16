const speech = require("@google-cloud/speech").v1p1beta1;
const fs = require("fs");

const transcribeAudio = {
	oneLanguageTranscribe: async (req, res) => {
		try {
			const { language, numSpeakers } = req.body;

			const client = new speech.SpeechClient();

			const fileName = "";

			const config = {
				encoding: "LINEAR16",
				sampleRateHertz: 48000,
				languageCode: language,
				audioChannelCount: 2,
				enableSpeakerDiarization: true,
				minSpeakerCount: numSpeakers,
				maxSpeakerCount: numSpeakers,
				model: "default",
			};

			const audio = {
				content: fs.readFileSync(fileName).toString("base64"),
			};

			const request = {
				config: config,
				audio: audio,
			};

			const [response] = await client.recognize(request);
			const transcription = response.results
				.map((result) => result.alternatives[0].transcript)
				.join("\n");
			console.log(`Transcription: ${transcription}`);
			console.log("Speaker Diarization:");
			const result = response.results[response.results.length - 1];
			const wordsInfo = result.alternatives[0].words;

			wordsInfo.forEach((a) =>
				console.log(` word: ${a.word}, speakerTag: ${a.speakerTag}`)
			);

			return res.send({
				status: "success",
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},
};

module.exports = transcribeAudio;
