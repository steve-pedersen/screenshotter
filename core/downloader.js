/*
	Downloader handles creating one time download links to files. It does this by writing the true
	file path to a screenshot to a cache along with a unique id. It will also handle redirects
	to the temporary one time download location. Once the real file has been downloaded, the entry
	in the cache is deleted.

	@author Steve Pedersen (pedersen@sfsu.edu)
*/

const url 		= require('url');
const fs     	= require('fs');
const crypto 	= require('crypto');
const path   	= require('path');
const redis 	= require('redis');
const logger 	= requireWrapper('config/winston');


class Downloader {

	constructor(options) { 
		this.client = redis.createClient(options);
	}

	/* Creates a download session */
	createDownload(filePath, callback) {
		if (!fs.existsSync(filePath)) return callback(new Error('File does not exist'));
		// Generate the download sid (session id)
		var downloadSid = crypto.createHash('md5').update((Math.random().toString() || '') + filePath).digest('hex');
		// save file path using sid as key
		this.client.set(downloadSid, filePath, function(err, data) {});
		// If succeeded, return the new download sid
		callback(null, downloadSid);
	}

	/* Gets the download file path related to a download sid */
	getDownloadFilePath(downloadSid, callback) {
		this.client.get(downloadSid, function (err, data) {
			return callback(err, data);
		});
	}

	/* Deletes a download session */
	deleteDownload(downloadSid, callback) {
		var error = null;
		this.client.del(downloadSid.toString(), function(err) {
			console.log('lol');
			error = err;
			return callback(err);
		});
		console.log('yo', error);
		callback(error);
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
				let downloadUrl = `${req.protocol}://${req.hostname}:${appPort}`;
				downloadUrl = new URL(downloadUrl + '/api/v1/screenshots/download');
				downloadUrl.search = 'sid=' + downloadSid;
				req.downloadLink = downloadUrl.href;

				if (err) {
					logger.log('error', 'Error saving file path to cache.', { extra: {
						downloadUrl: downloadUrl.href
					}});
				} else {
					logger.log('debug', 'File path saved to cache.', { extra: {
						downloadUrl: downloadUrl.href
					}});
				}
			});

			return res.json({ imageurl: req.downloadLink });

		} catch (e) {
			next(e);
		}
	}

	async download(req, res, next) {
	  	// Get the download sid
	  	var downloadSid = req.query.sid;
	  	var downloader = this;

	  	// Get the download file path
	  	this.getDownloadFilePath(downloadSid, function(err, filePath) {
			if (err) return res.json({ error: (err.toString() || '') });
			if (!filePath) return res.json({ error: 'Filepath does not exist for the requested image.' });

			filePath = filePath ? filePath.toString() : '';
			let fileName = path.basename(filePath);

			// Read and send the file here...
			res.download(filePath, fileName, function (err) {
				if (err) {
					logger.log('error', 'Error downloading file - ' + downloadSid, { extra: {
						fileLocation: filePath
					}});
				} else {
					logger.log('debug', 'Downloading file - ' + downloadSid, { extra: {
						fileLocation: filePath
					}});
				}
				next(err);
			});

			// Finally, delete the download session to invalidate the link
			downloader.deleteDownload(downloadSid, function(err) {
				if (err) {
					logger.log('error', 'Unable to delete session entry from cache - ' + downloadSid);
				} else {
					logger.log('debug', 'Download session entry deleted - ' + downloadSid);
				}
			});
	  	});
	}

}

// TODO: import options somehow
async function create(options) {
	const redisOptions = options || {
		host: process.env.REDIS_HOST || "127.0.0.1"
	};

	return new Downloader( redisOptions );
}


module.exports = create;