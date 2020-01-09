const createRenderer = require('./renderer');
const pathtools = require('./pathtools')();
const logger = requireWrapper('config/winston');

// Create screenshot renderer and start cron.
let renderer = createRenderer()
	.then(createdRenderer => {
		renderer = createdRenderer;
		console.info('Initialized screenshot renderer.');
	})
	.then(() => {
		pathtools.runCron();
	})
	.catch(e => {
		console.error('Fail to initialze screenshot renderer.', e);
	});



var screenshotsMiddleware = async (req, res, next) => {
	let { url, method, ...options } = req.query;

	if (!url) {
		return res.status(400).send('Search with url parameter. For example, ?url=http://yourdomain');
	}
	url = decodeURIComponent(url);

	if (!url.includes('://')) {
		url = `http://${url}`;
	}
	// strip one or more trailing slashes
	url = url.replace(/\/+$/, "");
	
	// access token
	options.token = req.header('X-Custom-Header');

	const pathInfo = pathtools.pathFinder(req, url);
	req.imagePath = pathInfo.path;

	if (pathInfo.fileExists) {
		logger.log('debug', 'Screenshot file exists. Returning cached image.');
		req.fileExists = true;
		next();
		return req;
	} else {
		// set path for where to save the new screenshot
		req.fileExists = false;
		options.path = pathInfo.path;
	}

	try {
		switch (method) {
			case 'screenshot':
			default:
				if (!pathInfo.fileExists) {
					const image = await renderer.screenshot(url, options, res);
					req.image = image;
					next();
				}
		}
	} catch (e) {
		logger.log('error', 'screenshots.js - Error when attempting screenshot.', { extra: {
			error: (e || '')
		}});		
		next(e);
	}
}


module.exports = screenshotsMiddleware;







// CODE TO USE FOR OTHER FORMATS
// 
// case 'pdf': // incomplete
// 	const urlObj = new URL(url);
// 	let filename = urlObj.hostname;
// 	if (urlObj.pathname !== '/') {
// 		filename = urlObj.pathname.split('/').pop();
// 		if (filename === '') filename = urlObj.pathname.replace(/\//g, '');
// 		const extDotPosition = filename.lastIndexOf('.');
// 		if (extDotPosition > 0) filename = filename.substring(0, extDotPosition);
// 	}
// 	const pdf = await renderer.pdf(url, options);
// 	res
// 		.set({
// 			'Content-Type': 'application/pdf',
// 			'Content-Length': pdf.length,
// 			'Content-Disposition': contentDisposition(filename + '.pdf'),
// 		})
// 		.send(pdf);
// 	break;

// case 'render':
// 	const html = await renderer.render(url, options);
// 	res.status(200).send(html);
// 	break;