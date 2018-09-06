const { URL } = require('url');
var fs     = require('fs');
var crypto = require('crypto');
var path   = require('path');

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
		// Check the existence of DL_SESSION_FOLDER
		if (!fs.existsSync(DL_SESSION_FOLDER)) return callback(new Error('Session directory does not exist'));

		// Check the existence of the file
		if (!fs.existsSync(filePath)) return callback(new Error('File doest not exist'));

		// Generate the download sid (session id)
		var downloadSid = crypto.createHash('md5').update(Math.random().toString()).digest('hex');

		// Generate the download session filename
		var dlSessionFileName = path.join(DL_SESSION_FOLDER, downloadSid + '.download');

		// // Write the link of the file (async) to the download session file
		// fs.writeFile(dlSessionFileName, filePath, function(err) {
		// 	if (err) return callback(err);
		// 	console.log('no error writing file');
		// 	// If succeeded, return the new download sid
		// 	callback(null, downloadSid);
		// });
		// Write the link of the file (sync) to the download session file
		fs.writeFileSync(dlSessionFileName, filePath);
		// If succeeded, return the new download sid
		callback(null, downloadSid);
	}

	getDownloadUrl() {
		return this.downloadUrl;
	}

	/* Gets the download file path related to a download sid */
	getDownloadFilePath(downloadSid, callback) {
		// Get the download session file name
		var dlSessionFileName = path.join(DL_SESSION_FOLDER, downloadSid + '.download');

		// Check if the download session exists
		if (!fs.existsSync(dlSessionFileName)) return callback(new Error('Download does not exist'));

		// Get the file path
		fs.readFile(dlSessionFileName, 'utf8', function(err, data) {
			if (err) return callback(err);

			// Return the file path
			callback(null, data);
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

}


module.exports = new Downloader;