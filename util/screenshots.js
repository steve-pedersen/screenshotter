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
	if (!url.includes('://')) {
		url = `http://${url}`;
	}
	url = url.replace(/\/+$/, "");	// strip one or more trailing slashes

	const pathInfo = pathFinder(req, url);
	req.imagePath = pathInfo.path;
	// use path of existing image and don't proceed
	// or set path for where to save the new screenshot
	if (pathInfo.fileExists) {
		console.log('Screenshot exists already.');
		next();
		return req; // need to return from here.
	} else {
		console.log('going to create something new....');
		options.path = pathInfo.path;
	}


	try {
		switch (method) {
			case 'pdf': // incomplete
				const urlObj = new URL(url);
				let filename = urlObj.hostname;
				if (urlObj.pathname !== '/') {
					filename = urlObj.pathname.split('/').pop();
					if (filename === '') filename = urlObj.pathname.replace(/\//g, '');
					const extDotPosition = filename.lastIndexOf('.');
					if (extDotPosition > 0) filename = filename.substring(0, extDotPosition);
				}
				const pdf = await renderer.pdf(url, options);
				res
					.set({
						'Content-Type': 'application/pdf',
						'Content-Length': pdf.length,
						'Content-Disposition': contentDisposition(filename + '.pdf'),
					})
					.send(pdf);
				break;

			case 'render':
				const html = await renderer.render(url, options);
				res.status(200).send(html);
				break;
			case 'screenshot':
			default:
				console.log('in screenshots.js and default case');
				const image = await renderer.screenshot(url, options);
				req.image = image;
				next();
		}

	} catch (e) {
		next(e);
	}
}


module.exports = screenshotsMiddleware;