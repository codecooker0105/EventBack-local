import crypto from 'crypto';
import { stringify, parse } from 'json-buffer';

import redisCreateClient from './redis';

const redisClient = redisCreateClient();

const selectMethods = [
	'findAll',
	'findByPk',
	'findOne',
	'count',
	'findAndCountAll',
	'min',
	'max',
	'sum',
	'findAndCount',
	'query',
	'all',
];

const changeMethods = [
	'bulkCreate',
	'create',
	'update',
	'upsert',
];

function desymbolize(o) {
	if (Array.isArray(o)) {
		return o.map(desymbolize);
	} else if (typeof o != "object") {
		return o;
	} else if (o instanceof Date) {
		return o;
	} else {
		let d = Object.assign(Object.create(Object.getPrototypeOf(o)), o);
		Object.getOwnPropertySymbols(o).forEach(k => {
			const symbol = Symbol.keyFor(k)
			if (symbol) {
				d[`<${symbol}>`] = o[k];
				delete d[k];
			}
		});
		Object.keys(d).forEach(k => d[k] = desymbolize(d[k]));
		return d;
	}
}

export default function generateRedisModel(model, options = {}) {
	options = {
		ttl: 600,
		...options
	}

	async function run(cacheKey, method, ...args) {
		if (!selectMethods.includes(method)) {
			throw new Error('Unsupported method');
		}
		if (!model[`org_${method}`]) {
			throw new Error('Unsupported Method by Sequelize model');
		}

		cacheKey += method;
		if (args && args.length > 0) {
			const hash = crypto.createHash('sha1').update(JSON.stringify(desymbolize(args))).digest('hex');
			cacheKey += `:${hash}`;
		}

		let cached;
		try {
			cached = await redisClient.getAsync(cacheKey);
		} catch (error) {
			throw new Error(`Cant get cached object from Redis ${error.message}`);
		}

		if (cached) {
			let parsed;
			try {
				parsed = parse(cached);
			} catch (error) {
				throw new Error(`Cant parse JSON of cached model's object: ${error.message}`);
			}

			try {
				let result;
				let queryOptions;
				if (args.length > 0) queryOptions = args.slice(-1)[0];

				if (queryOptions && !!queryOptions.raw) {
					result = parsed;
				} else if (parsed.rows) {
					result = {
						...parsed,
						rows: parsed.rows.map(parsedRow => model.build(parsedRow)),
					};
				} else if (typeof parsed === 'number') {
					result = parsed;
				} else if (queryOptions) {
					const buildOptions = {
						raw: !!queryOptions.raw,
						isNewRecord: !!queryOptions.isNewRecord,
					};
					if (queryOptions.include) {
						buildOptions.include = queryOptions.include;
					}
					result = model.build(parsed, buildOptions);
				} else {
					result = model.build(parsed);
				}

				return result;
			} catch (error) {
				throw new Error(`Cant build model from cached JSON: ${error.message}`);
			}
		}

		const result = await model[`org_${method}`](...args);
		let toCache;
		if (!result) {
			return result;
		}
		
		if (Array.isArray(result) || result.rows || typeof result === 'number') {
			// Array for findAll, result.rows for findAndCountAll, typeof number for count/max/sum/etc
			toCache = result;
		} else if (result.toString().includes(('[object SequelizeInstance'))) {
			toCache = result;
		} else {
			let queryOptions;
			if (args.length > 0) queryOptions = args.slice(-1)[0];

			if (queryOptions && !!queryOptions.raw) {
				toCache = result;
			} else {
				throw new Error(`Unkown result type: ${typeof result}`);
			}
		}

		redisClient.set(cacheKey, stringify(toCache));

		if (options.ttl) {
			redisClient.expire(cacheKey, options.ttl);
		}

		return result;
	}
  
	selectMethods.forEach(method => {
		const cacheKey = `sequelize:${model.name}:`
		model[`org_${method}`] = model[method]
		model[method] = async (...args) => run(cacheKey, method, ...args);
	})

	changeMethods.forEach(method => {
		const cacheKey = `sequelize:${model.name}:`
		model[`org_${method}`] = model[method]
		model[method] = async (...args) => {
			if (!changeMethods.includes(method)) {
				throw new Error('Unsupported method');
			}
			if (!model[`org_${method}`]) {
				throw new Error('Unsupported Method by Sequelize model');
			}
			
			const result = await model[`org_${method}`](...args);
			redisClient.keys(`${cacheKey}*`, function(err, replies) {
				replies.forEach(function (reply, index) {
					redisClient.del(reply)
				});
			});

			if (model.relatives) {
				model.relatives.forEach(relative => {
					redisClient.keys(`sequelize:${relative}:*`, function(err, replies) {
						replies.forEach(function (reply, index) {
							redisClient.del(reply)
						});
					});
				})
			}

			return result;
		};
	})

	return model;
};