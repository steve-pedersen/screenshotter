const express = require('express');
const router = express.Router();
const screenshotRenderer = requireWrapper('core/screenshots');
const createDownloader = requireWrapper('core/downloader');


// Create screenshot downloader.
let downloader = createDownloader()
	.then(createdDownloader => {
		downloader = createdDownloader;
		console.info('Initialized screenshot downloader.');
	})
	.catch(e => {
		console.error('Fail to initialze screenshot downloader.', e);
	});


router.get('/screenshots', screenshotRenderer, (req, res, next) => {

	if (req.image || req.fileExists) {
		downloader.redirect(req, res, next);
		next();
	}
	
	next({ status: 500, message: 'An error occurred when attempting to screenshot.' });
});


router.get('/screenshots/download', async (req, res, next) => { 
	downloader.download(req, res, next);
});


router.use(function(req, res, next) {
	res.end();
});


module.exports = router;