var path 			= require('path');
global.appRoot = path.resolve(__dirname);
global.requireWrapper = name => { return require(__dirname + '/' + name); }
var createError 	= require('http-errors');
var express 		= require('express');
var cookieParser 	= require('cookie-parser');
var logger 			= require('morgan');
var apiV1Router 	= require('./routes/api-v1');


var app = express();
app.set('view engine', 'pug');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/favicon.ico', (req, res) => res.sendStatus(204));


apiV1Router.use('default', logger);

app.use('/api/v1', apiV1Router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	console.log('app.js trying to make 404');
	next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};
	console.log('app.js trying to handle error');
	// send the error response
	res.status(err.status || 500);
	res.end();
});

// Terminate process
process.on('SIGINT', () => {
	process.exit(0)
})

module.exports = app;
