const errorHandler = (err, _req, res, _next) => {
	return res.send({
		status: "error",
		message: err.message,
	});
};

module.exports = errorHandler;
