import { Router } from 'express';
import passport from 'passport';
import Joi from '@hapi/joi';
import models from '../../model';
import graph from '../../middleware/graph';
import logger from '../../middleware/logger';
import Sequelize from 'sequelize';
import notificationManager from '../../middleware/notification';
import QRCode from 'qrcode'
import uploader from '../../middleware/uploader';
import moment from 'moment';

const router = Router();

const Op = Sequelize.Op;

const EventAttributes = ['id', 'user_id', 'title', 'description', 'content', 'online_event', 'location', 'lat', 'lng', 'total_ticket', 'ticket_limit', 'poster', 'start_date', 'end_date', 'free_event', 'price', 'restriction_age', 'restriction_dress', 'restriction_refund', 'restriction_id', 'restriction_cash', 'status', 'qrcode', 'createdAt', 'updatedAt']
const EventIncludes = [
	{
		model: models.User,
		as: 'creator',
		attributes: [ 'id', 'first_name', 'last_name', 'photo' ],
	},
	{
		model: models.Comment,
		attributes: ['id', 'relation_id', 'text', 'user_id', 'createdAt', 'updatedAt'],
			as: 'comments',
			required: false,
			where: {
				type: 0
			},
		include: [
			{
				model: models.User,
				attributes: ['id', 'first_name', 'last_name', 'photo'],
				as: 'user'
			}
		]
	},
	{
		model: models.Reaction,
		attributes: ['user_id'],
		required: false,
		where: {
			type: 0,
			value: 1
		},
		as: 'likes'
	},
	{
		model: models.Reaction,
		attributes: ['user_id'],
		required: false,
		where: {
			type: 0,
			value: 2
		},
		as: 'dislikes'
	}
]

router.get('/public', async (req, res) => {
	try {
		const events = await models.Event.findAll({
			nest: true,
			raw: false,
			attributes: EventAttributes,
			include: EventIncludes,
		})
		res.status(200).send({
			data: events
		});
	} catch (err) {
		logger.error('Error on fetching events:', err);
		res.status(500).send({
			errors: [err]
		});
	}
})

router.get('/', passport.authenticate('jwt', { failWithError: true, session: false }), async (req, res) => {
	try {
		const graphEvents = graph.findEvents(req.user.id, "", null, 50)
		const eventIds = graphEvents.map(eventNode => eventNode.get('id'));
		const events = await models.Event.findAll({
			nest: true,
			raw: false,
			attributes: EventAttributes,
			include: EventIncludes,
			where: { id: { [Op.in]: eventIds } }
		})
		events.sort((a, b) => eventIds.indexOf(a.id) - eventIds.indexOf(b.id));
		res.status(200).send({
			data: events
		});
	} catch (err) {
		logger.error('Error on fetching events:', err);
		res.status(500).send({
			errors: [err]
		});
	}
})

router.get('/detail/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const event = await models.Event.findOne({
			attributes: EventAttributes,
			include: EventIncludes,
			where: { id }
		})
		res.status(200).send({
			data: event
		});
	} catch (err) {
		logger.error('Error on fetching event:', err);
		res.status(500).send({
			errors: [err]
		});
	}
})

router.get('/mine', passport.authenticate('jwt', { failWithError: true, session: false }), async (req, res) => {
	try {
		const { id } = req.user;
		const events = await models.Event.findAll({
			nest: true,
			raw: false,
			attributes: EventAttributes,
			include: [
				...EventIncludes,
				{
					model: models.Attend,
					as: 'attenders',
					required: false
				}
			],
			where: { user_id: id }
		})
		res.status(200).send({
			data: events
		});
	} catch (err) {
		logger.error('Error on fetching my events:', err);
		res.status(500).send({
			errors: [err]
		});
	}
})

router.post('/attend', passport.authenticate('jwt', { failWithError: true, session: false }), async (req, res) => {
	try {
		const { event_id } = req.body;
		const { id } = req.user;
		const attendCheck = await models.Attend.findOne({ where: { user_id: id, event_id }});
		if (attendCheck) {
			return res.status(200).send({
				data: { msg: 'success' }
			});
		}

		const ticketCheck = await models.Ticket.findOne({ where: { user_id: id, event_id }});
		if (!ticketCheck) {
			return res.status(403).send({
        errors: [{ message: `You have no tickets on this event.` }]
      });
		}

		await models.Attend.create({ user_id: id, event_id });
		res.status(200).send({
			data: { msg: 'success' }
		});
	} catch (err) {
		logger.error('Error on attending event:', err);
		res.status(500).send({
			errors: [err]
		});
	}
})

router.post('/', passport.authenticate('jwt', { failWithError: true, session: false }), async (req, res) => {
	const { title, description, content, online_event, location, lat, lng, start_date, end_date, total_ticket, ticket_limit, price, free_event, poster, restriction_age, restriction_dress, restriction_refund, restriction_id, restriction_cash } = req.body;
	const { id, first_name, last_name } = req.user;
	const schema = Joi.object().keys({
		title: Joi.string().required(),
		description: Joi.string().required(),
		content: Joi.string().required(),
		online_event: Joi.number().min(0).max(1).required(),
		location: Joi.string().required(),
		lat: Joi.number().required(),
		lng: Joi.number().required(),
		start_date: Joi.date().required(),
		end_date: Joi.date().required(),
		total_ticket: Joi.number().min(1).required(),
		ticket_limit: Joi.number().min(1).max(50).required(),
		free_event: Joi.number().min(0).max(1).required(),
		price: Joi.number().required(),
		poster: Joi.string().required(),
	});
  
	try {
		Joi.assert({ title, description, content, online_event, location, lat, lng, start_date, end_date, total_ticket, ticket_limit, price, poster, free_event, poster }, schema, { abortEarly: false });
	} catch (err) {
		const errors = err.details.map(error => ({ message: error.message }))
		return res.status(403).send({
			errors
		});
	}

	try {
		const result = await models.Event.create({
			user_id: id,
			title, description, content, online_event, poster,
			location: online_event === 1 ? 'Online Event' : location, 
			lat, lng, start_date, end_date, total_ticket, ticket_limit, free_event,
			price: free_event === 1 ? 0 : price, 
			restriction_age,
			restriction_dress,
			restriction_refund,
			restriction_id,
			restriction_cash
		})
		const event = result.get({ plain: true });
		let text = JSON.stringify({ eventree_id: event.id })
    let uri = await QRCode.toDataURL(text, { errorCorrectionLevel: 'L', width: 400, margin: 0, scale: 1});
		let fileURL = await uploader.upload64({uri, name: ''});
		await models.Event.update({ qrcode: fileURL.Location }, { where: { id: event.id }});
		
		notificationManager.sendEventCreateNotification(id, `${first_name} ${last_name}`, title);
		
		graph.addEvent(event)
		
		res.status(200).send({
			data: { event }
		});
	} catch (err) {
		logger.error('Error on creating event:', err);
		res.status(500).send({
			errors: [err]
		});
	}
})

router.post('/search', passport.authenticate('jwt', { failWithError: true, session: false }), async (req, res) => {
	try {
		const { search_string, from, to } = req.body;
		let condition = { start_date: { [Op.ne] : null }};
		if (search_string && search_string.length > 0) {
			condition.title = { [Op.iLike]: `%${search_string}%` } 
		}
		
		if (from && from.length > 0) {
			condition.start_date = { ...condition.start_date, [Op.gte]: moment(from).format("YYYY-MM-DD HH:mm:ss") } 
		}
		if (to && to.length > 0) {
			condition.start_date = { ...condition.start_date, [Op.lte]: moment(to).format("YYYY-MM-DD HH:mm:ss") } 
		}
		const events = await models.Event.findAll({
			nest: true,
			raw: false,
			attributes: EventAttributes,
			include: EventIncludes,
			where: condition
		})
		res.status(200).send({
			data: events
		});
	} catch (err) {
		logger.error('Error on fetching events:', err);
		res.status(500).send({
			errors: [err]
		});
	}
})

export default router;