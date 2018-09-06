const downloader = requireWrapper('util/downloader');
const url = require('url');

var redirectMiddleware = async (req, res, next) => {

	try {

		downloader.createDownload(req.imagePath, function(err, downloadSid) {
			// let url = req.protocol + '://' + req.hostname + ':' + process.env.PORT
			let downloadUrl = req.protocol + '://' + req.hostname + ':3000'
			downloadUrl = new URL(downloadUrl + '/api/v1/screenshots/download');
			downloadUrl.search = 'sid=' + downloadSid;

			req.downloadLink = downloadUrl.href;
		});

		const imagePath = req.imagePath;
		const downloadLink = req.downloadLink;

		return res
			// .status(200)
			.json({ 
				imagePath: imagePath,
				downloadLink: downloadLink
			});

		next();

	} catch (e) {
		next(e);
	}
}


module.exports = redirectMiddleware;