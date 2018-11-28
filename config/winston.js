const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const myFormat = printf(info => {
	var options = { year: '2-digit', month: '2-digit', day: '2-digit',
									hour: '2-digit', minute: '2-digit', second: 'numeric', 
									timeZoneName: 'short', hour12: false };
	var americanDateTime = new Intl.DateTimeFormat('en-US', options).format;
	var url = info.url ? `- ${info.url}` : '';
	var extra = '';
	if (info.extra) {
		Object.keys(info.extra).forEach(function (key) { 
			let spaces = ' '.repeat(15 - key.length);
			extra += `\n${spaces}${key}: ${info.extra[key]}`;
		});
	}
	return `[${info.level}] ${americanDateTime(new Date(info.timestamp))}: ${info.message} ${url} ${extra}`;
});

var options = {
	file: {
		level: process.env.LOG_LEVEL || 'debug',
		filename: `${appRoot}/app.log`,
		handleExceptions: true,
		json: true,
		maxsize: 5242880, // 5MB
		maxFiles: 5,
		colorize: true,
	},
	console: {
		level: process.env.LOG_LEVEL || 'debug',
		handleExceptions: true,
		json: false,
		colorize: true,
	},
};

const logger = createLogger({
	format: combine(
		timestamp(),
		myFormat
	),
	transports: [
		//
		// - Write to all logs with level `info` and below to `combined.log` 
		// - Write all logs error (and below) to `error.log`.
		//
		new transports.File(options.file),
		new transports.Console(options.console)
	],
	exitOnError: false, // do not exit on handled exceptions
});

logger.stream = {
	write: function(message, encoding) {
		logger.info(message);
	},
};

module.exports = logger;