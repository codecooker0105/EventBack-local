import { Router } from 'express';
import models from '../../model';
import logger from '../../middleware/logger';
import Sequelize from 'sequelize';
import stripe from '../../middleware/stripe';
import config from '../../config';

const router = Router();

const Op = Sequelize.Op;

const TicketAttributes = ['id', 'event_id', 'user_id', 'amount', 'price', 'status', 'createdAt', 'updatedAt']
const TicketIncludes = [
	{
    model: models.Event,
    attributes: ['id', 'title', 'start_date', 'end_date', 'location'],
		as: 'eventinfo',
		required: false,
    include: [
      {
        model: models.User,
        as: 'creator',
        attributes: [ 'id', 'first_name', 'last_name', 'photo' ],
      },
    ]
  },
  {
		model: models.User,
    as: 'owner',
		attributes: [ 'id', 'first_name', 'last_name', 'photo' ],
	},
]

router.get('/', async (req, res) => {
  const { id } = req.user;
	try {
		const tickets = await models.Ticket.findAll({
			nest: true,
			raw: false,
			attributes: TicketAttributes,
      include: TicketIncludes,
      where: {
        status: 0,
        user_id: id
      }
		})
		res.status(200).send({
			data: tickets
		});
	} catch (err) {
		logger.error('Error on fetching tickets:', err);
		res.status(500).send({
			errors: [err]
		});
	}
})

router.post('/checkTicketLimit', async (req, res) => {
	const { id } = req.user;
	const { event_id, amount } = req.body;
	try {
		const event = await models.Event.findByPk(event_id);
		const { total_ticket, ticket_limit } = event;

		const totalAmount = await models.TicketPurchase.findAll({
			attributes: [
				[Sequelize.fn('sum', Sequelize.col('amount')), 'total_amount'],
			],
			where: { event_id }
		});
		const leftAmount = total_ticket - parseInt(totalAmount || 0, 10);
		if (leftAmount < amount) {
			return res.status(403).send({
				errors: [{ message: leftAmount <= 0 ? `No more tickets left on this event.` : `${leftAmount} tickets are remaining.` }]
			});
		}

		const previousPurchase = await models.TicketPurchase.findOne({ where: {user_id: id, event_id} });
		let previousAmount = !previousPurchase ? 0 : previousPurchase.amount;
		if (previousAmount + amount > ticket_limit) {
			let remain = ticket_limit - previousAmount;
			return res.status(403).send({
				errors: [{ message: remain <= 0 ? `You can't buy any more tickets on this event.` : `You can buy only ${remain} tickets.` }]
			});
		}

		res.status(200).send({
			data: { msg: 'success' }
		});
	} catch (err) {
		logger.error('Error on checking limit:', err);
		res.status(500).send({
			errors: [err]
		});
	}
})

router.post('/buyOnEvent', async (req, res) => {
	const { id, first_name, last_name } = req.user;
	const { token, event_id, amount } = req.body;
	try {
		const event = await models.Event.findByPk(event_id);
		const { price, user_id, title, free_event } = event;

		if (free_event === 0) {
			const total = price * amount * (100 + config.service_fee);
			if (token) {
				const result = await stripe.createCharge(total, 'usd', token);
				if (!result) {
					return res.status(403).send({
						errors: [{ message: `There's a problem on checkout.` }]
					});
				}
			}
			
			await models.PaymentHistory.create({user_id: id, amount: (total / 100).toFixed(2), type: 1, related_user_id: user_id, description: `Buy ${amount} tickets on event - ${title}`});
			await models.PaymentHistory.create({user_id, amount: (price * amount).toFixed(2), type: 0, related_user_id: id, description: `User ${first_name} ${last_name} bought ${amount} tickets on event - ${title}`});

			let creator = await models.User.findByPk(user_id);
			await models.User.update({cash: (creator.cash + price * amount).toFixed(2)}, { where: { id: user_id }});
		}
		
		let purchase = await models.TicketPurchase.findOne({ where: {user_id: id, event_id} });
		if (!purchase) {
			await models.TicketPurchase.create({ event_id, user_id: id, amount });
		} else {
			await models.TicketPurchase.update({ amount: purchase.amount + amount }, { where: { id: purchase.id }});
		}

		let ticket = await models.Ticket.findOne({ where: {user_id: id, event_id} });
		if (!ticket) {
			await models.Ticket.create({ event_id, user_id: id, amount, price, status: 0})
		} else {
			await models.Ticket.update({ amount: ticket.amount + amount, price }, { where: { id: ticket.id }});
		}

		res.status(200).send({
			data: {}
		});
	} catch (err) {
		logger.error('Error on buying tickets:', err);
		res.status(500).send({
			errors: [err]
		});
	}
})

router.post('/sendToFriend', async (req, res) => {
	const { id } = req.user;
	const { ticket_id, amount, friend_id } = req.body;
	try {
		const ticketItem = await models.Ticket.findByPk(ticket_id);
		const marketItem = await models.Market.findOne({ where: { user_id: id, ticket_id }});
		let marketAmount = marketItem ? marketItem.amount : 0;
		let availableAmount = ticketItem.amount - marketAmount;
		if (availableAmount < amount) {
			return res.status(403).send({
        errors: [{ message: `You can send only ${availableAmount} tickets.` }]
      });
		}

		if (ticketItem.amount === amount) {
			await models.Ticket.destroy({ where: { id: ticketItem.id} });
		} else {
			await models.Ticket.update({ amount: ticketItem.amount - amount }, { where: { id: ticketItem.id}})
		}
		const friendTicket = await models.Ticket.findOne({ where: { id: ticket_id, user_id: friend_id }});
		if (friendTicket) {
			await models.Ticket.update({ amount: friendTicket.amount + amount }, { where: { id: friendTicket.id }})
		} else {
			await models.Ticket.create({ user_id: friend_id, amount, price: ticketItem.price, event_id: ticketItem.event_id })
		}

		res.status(200).send({
			data: {}
		});
	} catch (err) {
		logger.error('Error on sending to friend:', err);
		res.status(500).send({
			errors: [err]
		});
	}
})

router.post('/buyOnMarket', async (req, res) => {
	const { id, first_name, last_name } = req.user;
	const { token, market_id, amount } = req.body;
	try {
		const marketItem = await models.Market.findByPk(market_id);
		if (amount > marketItem.amount) {
			return res.status(403).send({
				errors: [{ message: `You can buy only ${marketItem.amount} tickets` }]
			});
		}

		const { price, user_id } = marketItem;
		const relatedUser = await models.User.findByPk(user_id);
		
		const total = price * amount * (100 + config.service_fee);
		if (token) {
			const result = await stripe.createCharge(total, 'usd', token);
			if (!result) {
				return res.status(403).send({
					errors: [{ message: `There's a problem on checkout.` }]
				});
			}
		}
		
		await models.PaymentHistory.create({user_id: id, amount: (total / 100).toFixed(2), type: 1, related_user_id: user_id, description: `Buy ${amount} tickets on Market from ${relatedUser.first_name} ${relatedUser.last_name}`});
		await models.PaymentHistory.create({user_id, amount: (price * amount).toFixed(2), type: 0, related_user_id: id, description: `User ${first_name} ${last_name} bought ${amount} tickets on Market`});

		await models.User.update({cash: (relatedUser.cash + price * amount).toFixed(2)}, { where: { id: user_id }});
		
		if (amount === marketItem.amount) {
			await models.Market.destroy({ where: { id: market_id }})
		} else {
			await models.Market.update({ amount: marketItem.amount - amount }, { where: { id: market_id }});
		}

		const ticketItem = await models.Ticket.findOne({ where: { id: marketItem.ticket_id }})
		if (amount === ticketItem.amount) {
			await models.Ticket.destroy({ where: {id: ticketItem.id }})
		} else {
			await models.Market.update({ amount: ticketItem.amount - amount }, { where: { id: marketItem.ticket_id }});
		}

		let ticket = await models.Ticket.findOne({ where: {user_id: id, event_id: ticketItem.event_id } });
		if (!ticket) {
			await models.Ticket.create({ event_id: ticketItem.event_id, user_id: id, amount, price, status: 0})
		} else {
			await models.Ticket.update({ amount: ticket.amount + amount, price }, { where: { id: ticket.id }});
		}

		res.status(200).send({
			data: {}
		});
	} catch (err) {
		logger.error('Error on buying tickets:', err);
		res.status(500).send({
			errors: [err]
		});
	}
})

router.post('/delete/:ticket_id', async (req, res) => {
	const { id } = req.user;
  const { ticket_id } = req.params;

  try {
		await models.Ticket.destroy({ where: { id: ticket_id } });
		await models.Market.destroy({ where: { user_id: id, ticket_id }});
    res.status(200).send({
      data: { msg: 'success' }
    });
  } catch (err) {
    logger.error('Error on deleting market:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

export default router;