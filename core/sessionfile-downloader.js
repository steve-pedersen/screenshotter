/*
	Downloader handles creating one time download links to files. It does this by writing the true
	file path to a screenshot to a file stored in the DL_SESSION_FOLDER. It will also handle redirects
	to the temporary one time download location. Once the real file has been downloaded, the temp
	file is deleted.

	@author https://stackoverflow.com/a/22001828	
	@author Steve Pedersen (pedersen@sfsu.edu)
*/

const url 		= require('url');
const fs     	= require('fs');
const crypto 	= require('crypto');
const path   	= require('path');

// Path where we store the download sessions
const DL_SESSION_FOLDER = appRoot + '/download_sessions';

class Downloader {

	constructor() { 
		if (!fs.existsSync(DL_SESSION_FOLDER)) {
			this.createDir(DL_SESSION_FOLDER);
		}
	}

	/* Creates a download session */
	createDownload(filePath, callback) {
		if (!fs.existsSync(DL_SESSION_FOLDER)) return callback(new Error('Session directory does not exist'));
		if (!fs.existsSync(filePath)) return callback(new Error('File does not exist'));

		// Generate the download sid (session id)
		var downloadSid = crypto.createHash('md5').update(Math.random().toString()).digest('hex');
		// Generate the download session filename
		var dlSessionFileName = path.join(DL_SESSION_FOLDER, downloadSid + '.download');
		// Write the link of the file (sync) to the download session file
		fs.writeFileSync(dlSessionFileName, filePath);
		// If succeeded, return the new download sid
		callback(null, downloadSid);
	}

	/* Gets the download file path related to a download sid */
	getDownloadFilePath(downloadSid, callback) {
		// Get the download session file name
		var dlSessionFileName = path.join(DL_SESSION_FOLDER, downloadSid + '.download');
		// Check if the download session exists
		if (!fs.existsSync(dlSessionFileName)) return callback(new Error('Download does not exist'));

		// Get the file path
		fs.readFile(dlSessionFileName, 'utf8', function(err, trueFilePath) {
			if (err) return callback(err);
			// Return the file path
			callback(null, trueFilePath);
		});
	}

	/* Deletes a download session */
	deleteDownload(downloadSid, callback) {
		// Get the download session file name
		var dlSessionFileName = path.join(DL_SESSION_FOLDER, downloadSid + '.download');
		// Check if the download session exists
		if (!fs.existsSync(dlSessionFileName)) return callback(new Error('Download does not exist'));

		// Delete the download session
		fs.unlink(dlSessionFileName, function(err) {
			if (err) return callback(err);
			// Return success (no error)
			callback();
		});
	}

	createDir(dir) {
		let separated = dir.split(path.sep);
		let working = '';
		if (separated !== undefined || separated.length != 0) {
			separated.forEach(function(element) {
				working += element + '/';
				if (!fs.existsSync(working)) {
					fs.mkdirSync(working);
				}
			});
		}
	}

	// TODO: fine tune this download url. Might have to deal with API gateway
	async redirect(req, res, next) {
		try {
			this.createDownload(req.imagePath, function(err, downloadSid) {
				// let url = req.protocol + '://' + req.hostname + ':' + process.env.PORT
				let downloadUrl = req.protocol + '://' + req.hostname + ':3000'	
				downloadUrl = new URL(downloadUrl + '/api/v1/screenshots/download');
				downloadUrl.search = 'sid=' + downloadSid;

				req.downloadLink = downloadUrl.href;
			});

			// DEBUG: TRYING DIFFERENT RESPONSE HERE **********************************
			return res.json({ imageurl: req.downloadLink });

			// return res.redirect(req.downloadLink);

		} catch (e) {
			next(e);
		}
	}

	async download(req, res, next) {
	  	// Get the download sid
	  	var downloadSid = req.query.sid;
	  	var that = this;

	  	// Get the download file path
	  	this.getDownloadFilePath(downloadSid, function(err, filePath) {
			if (err) return res.json({ error: err.toString() });

			filePath = filePath.toString();
			let fileName = path.basename(filePath);

			// Read and send the file here...
			res.download(filePath, fileName, function (err) {
				if (err) {
					next(err);
				} else {
					next();
				}
			});

			// Finally, delete the download session to invalidate the link
			that.deleteDownload(downloadSid, function(err) {
				if (err) console.log('Error deleting download session file');
			});
	  	});
	}

}


module.exports = new Downloader;