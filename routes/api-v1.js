const express = require('express');
const router = express.Router();
// const cookieParser = require('cookie-parser');
const screenshotMiddleware = requireWrapper('util/screenshots');
const redirectMiddleware = requireWrapper('util/redirect');
const downloader = requireWrapper('util/downloader');
const downloaderMiddleware = requireWrapper('util/downloaderMiddleware');


// router.use(cookieParser());

// router.use(function(req, res, next) {
// 	console.log(
// 		'REQUEST HOST: %s\nMETHOD: %s\nURL: %s\nENDPOINT: %s\nPARAMS: %o', 
// 		req.hostname, req.method, req.url, req.path, req.query
// 	);
// 	console.log('COOKIES: ', req.cookies);
// 	console.log('SIGNED COOKIES: ', req.signedCookies);
// 	next();
// });

router.get('/screenshots', screenshotMiddleware, redirectMiddleware, function(req, res, next) {
	console.log('here in router...............');
	return res.end();
});

router.get('/screenshots/download', downloaderMiddleware);


router.use(function(req, res, next) {
	res.end();
});


module.exports = router;
