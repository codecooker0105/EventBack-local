import publicRouter from './public';
import frontRouter from './front';
import adminRouter from './admin';

import config from '../config';
import logger from '../middleware/logger';

export default function(app){

	publicRouter(app)
	frontRouter(app)
	// adminRouter(app)

	// not found error.
	app.use(function(req, res, next) {
		let err = new Error('Not Found');
		err.status = 404;
		next(err);
	});

	// error handler, if development mode will print stacktrace
	app.use(function(err, req, res, next) {
		logger.error('API response error:', err)
		res.status(err.status || 500);
		res.json({
			errors: [config.env_mode == 'development'? err: { message: err.message || 'Internal Server Error' }]
		});
	});

}