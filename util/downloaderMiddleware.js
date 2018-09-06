const downloader = requireWrapper('util/downloader');
const pathModule = require('path');

var downloaderMiddleware = async (req, res, next) => {
  	// Get the download sid
  	var downloadSid = req.query.sid;

  	// Get the download file path
  	downloader.getDownloadFilePath(downloadSid, function(err, path) {
		if (err) return res.end('Error');

		path = path.toString();
		let fileName = pathModule.basename(path);
		
		// Read and send the file here...
		res.download(path, fileName, function (err) {
			if (err) {
				console.log('error downloading: ', err);
				next(err);
			} else {
				console.log('Sent: ', fileName);
				next();
			}
		});

		// Finally, delete the download session to invalidate the link
		downloader.deleteDownload(downloadSid, function(err) {
			if (err) console.log('Error deleting download session file');
		});
  	});
}

module.exports = downloaderMiddleware;