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
// const client 	= redis.createClient();


// const redisOptions = {
// 	host: process.env.REDIS_HOST || "127.0.0.1"
// };
// const options = {
// 	name: 'screenshotter',
// 	redisOptions: redisOptions,
// 	ttlInSeconds: '360'
// }
// const cache = new RedisStore(options);

class Downloader {

	constructor(options) { 
		this.client = redis.createClient(options);
	}

	/* Creates a download session */
	createDownload(filePath, callback) {
		if (!fs.existsSync(filePath)) return callback(new Error('File does not exist'));
		// Generate the download sid (session id)
		var downloadSid = crypto.createHash('md5').update(Math.random().toString() + filePath).digest('hex');
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
		this.client.del(downloadSid.toString(), function(err) {
			callback(err);
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
				console.log('DOWNLOAD LINK:  ', downloadUrl.href);
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
				if (err) console.log('Error deleting download entry');
			});
	  	});
	}

}

// TODO: import options somehow
async function create() {
	const redisOptions = {};

	return new Downloader( redisOptions );
}

// var build = create()
// 	.then(createdDownloader => {
// 		build = createdDownloader;
// 		console.info('Initialized screenshot downloader.');
// 	})
// 	.catch(e => {
// 		console.error('Fail to initialze screenshot downloader.', e);
// 	});

module.exports = create;