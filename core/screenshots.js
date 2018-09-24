const { URL } = require('url');
const contentDisposition = require('content-disposition');
const createRenderer = require('./renderer');
const pathFinder = require('./pathfinder');


// Create screenshot renderer.
let renderer = createRenderer()
	.then(createdRenderer => {
		renderer = createdRenderer;
		console.info('Initialized screenshot renderer.');
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
	url = url.replace(/\/+$/, "");	// strip one or more trailing slashes

	const pathInfo = pathFinder(req, url);
	req.imagePath = pathInfo.path;

	// use path of existing image and don't proceed
	// or set path for where to save the new screenshot
	if (pathInfo.fileExists) {
		req.fileExists = true;
		next();
		return req; // need to return from here.
	} else {
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