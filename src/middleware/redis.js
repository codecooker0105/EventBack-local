import redis from 'redis';
import bluebird from "bluebird";

import config from '../config';
import logger from './logger';

// make node_redis promise compatible
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

export default function createClient() {
	const client = redis.createClient({
		host: config.redis_host,
		port: config.redis_port,
		no_ready_check: true,
		password : config.redis_pass,
	});
	client.on('connect', () => {
		logger.info(`Connected to redis`);
	});
	client.on('error', err => {
		logger.error(`Error: ${err}`);
	});

	return client;
}