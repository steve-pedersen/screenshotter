/*
	Pathfinder looks for 'appName' as a query param in the request.
	This will become the unique identifier of the requesting application, 
	used to locate and store pre-existing or new screenshots.
	If 'appName' isn't passed in, the IP address of the requesting app will be used instead.

	The path is './screenshots/' plus hashes of <App Identifier> + <Url to Screenshot> 
	The filename is <Unix Timestamp for Now> + <File Extension>
	
	Complete example of a stored screenshot:

		./screenshots/e8a019f2555a843951b43a5af0c826c5/8ffdefbdec956b595d257f0aaeefd623/1535755118.jpg

	@author Steve Pedersen (pedersen@sfsu.edu)
*/

const pathModule = require('path');
const md5 = require('blueimp-md5');
const fs = require('fs');
const logger = requireWrapper('config/winston');

const EXPIRY_DAYS = 30;

var pathfinder = (req, url) => {

	let results = {};
	let path = appRoot + '/screenshots/';
	let getNew = (req.query.version === 'new') || false;
	let appIdentifier = req.query.appname || req.query.appName || req.ip;
	let type = req.query.type || 'jpeg';
	let extension = (type.toLowerCase() === 'png') ? '.png' : '.jpg';
	let newFilename = Math.round((+(new Date())) / 1000) + extension; 
	let filename = '';
	let fileExists = false;

	path = path + md5(appIdentifier) + '/' + md5(url);

	if (fs.existsSync(path)) {
		filename = fs.readdirSync(path);
		if (filename === undefined || filename.length == 0) {
			filename = newFilename;
		} else {
			filename = filename[0];
			if (fileExpired(path, filename) || getNew) {
				logger.log('debug', 'Screenshot file exists, but has expired. Deleting old file', {
					url: path + '/' + filename
				});
				fs.unlinkSync(path + '/' + filename);
				filename = newFilename;
			} else {
				fileExists = true;
			}
		}		
	} else {
		filename = newFilename;
	}

	let dir = path;
	path = path + '/' + filename;
	createScreenshotDir(dir);

	results.path = path;
	results.fileExists = fileExists;

	return results;
}

function fileExpired (path, filename) {
	let created = new Date(filename.substring(0, filename.indexOf('.'))*1000);
	let expiry = new Date();
	created.setDate(created.getDate() + EXPIRY_DAYS);

	return created.getTime() < expiry.getTime();
}

function createScreenshotDir(dir) {
	let separated = dir.split(pathModule.sep);
	let working = '';
	let newlyCreated = false;
	let options = { recursive: true, mode: 0777 }
	if (separated !== undefined || separated.length != 0) {
		separated.forEach(function(element) {
			working += element + '/';
			if (!fs.existsSync(working)) {
				fs.mkdirSync(working);
				newlyCreated = true;
			}
		});			
	}
	if (newlyCreated) {
		logger.log('debug', 'New Screenshot directory created.', {
			url: working
		});
	}
}

module.exports = pathfinder;