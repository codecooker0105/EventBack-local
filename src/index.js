import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';

import config from './config';
import { sequelize } from './model';
import router from './router';
import passport from './middleware/passport';
import logger from './middleware/logger';
import graph from './middleware/graph';

const app = express()
app.use(cors())
app.use(bodyParser.json({limit: '100mb'}))
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }))
app.use(helmet())
app.use(passport)
router(app)

// Create the HTTPS or HTTP server, per configuration
const server = http.createServer(app);

sequelize.sync({force: false}).then(() => {
	logger.info('Connected to database')
	graph.init();

	server.listen({ port: config.port }, () =>
		logger.info(
			`🚀 Server ready at: http${config.ssl ? 's' : ''}://${config.hostname}:${config.port}`
		)
	)
})