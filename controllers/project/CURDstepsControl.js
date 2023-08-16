const Step = require("../../models/project/step.model");
const Project = require("../../models/project/project.model");
const { catchAsync } = require("#utils");
const { Task } = require("#models").project;

const CRUDstepCtrl = {
	getSteps: async (req, res) => {
		if (
			req.user.role == "admin" ||
			req.user.role == "partner" ||
			req.user.role == "employee"
		) {
			try {
				const project = await Project.findById(req.params.idproject);
				const stepOfProject = project.steps;

				const steps = await Step.find({ _id: { $in: stepOfProject } });

				return res.send({ status: "success", steps: steps });
			} catch (err) {
				return res.send({ status: "error", message: err.message });
			}
		}
	},

	addSteps: async (req, res) => {
		try {
			const { title } = req.body;

			// Create Step
			const step = await Step.create({
				title,
				projectId: req.params.idproject,
			});

			step.save();

			// Add step id to project
			const project = await Project.findById(req.params.idproject);

			if (!project) {
				return res.send({
					status: "error",
					message: "Project Id does not exist",
				});
			}

			project.steps.push(step.id);

			project.save();

			const result = { ...step._doc, cards: [] };

			return res.send({ status: "success", step: result });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	updateStep: async (req, res) => {
		try {
			const result = await Step.findOneAndUpdate(
				{
					_id: req.params.idstep,
				},
				{ $set: req.body },
				{ returnOriginal: false }
			);

			console.log(result);

			return res.send({ status: "success", step: result });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	deleteStep: catchAsync(async (req, res) => {
		const step = await Step.findByIdAndDelete(req.params.idstep, {
			returnOriginal: true,
		});

		await Promise.all(
			step.tasks.map(async (task) => Task.findByIdAndDelete(task))
		);

		const project = await Project.findById(req.params.idproject);
		const stepArray = project.steps;

		const deletedStepIndex = stepArray.indexOf(req.params.idstep);
		stepArray.splice(deletedStepIndex, 1);

		project.steps = stepArray;
		project.save();

		return res.send({ status: "success", message: "Step deleted" });
	}),
};
module.exports = CRUDstepCtrl;
