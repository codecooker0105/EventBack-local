import { Router } from 'express';
import Joi from '@hapi/joi';
import models from '../../model';
import logger from '../../middleware/logger';

const router = Router();

const MarketAttributes = ['id', 'user_id', 'ticket_id', 'amount', 'price', 'create_date', 'update_date'];

const MarketIncludes = [
  {
    model: models.User,
		as: 'owner',
		attributes: [ 'id', 'first_name', 'last_name', 'photo' ],
  },
  {
    model: models.Ticket,
    as: 'ticket_info',
    include: [
      {
        model: models.Event,
        attributes: ['id', 'title', 'start_date'],
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
    ]
  }
];

router.post('/transfer', async (req, res) => {
  const { id } = req.user;
  const { amount, ticket_id, price } = req.body;
  
  const schema = Joi.object().keys({
    amount: Joi.number().required(),
    ticket_id: Joi.number().required(),
    price: Joi.number().required(),
  });

  try {
    Joi.assert({ amount, ticket_id, price }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    let ticketItem = await models.Ticket.findByPk(ticket_id);
    let marketItem = await models.Market.findOne({ where: { user_id: id, ticket_id }});

    let currentAmount = marketItem ? marketItem.amount : 0;
    let remain = ticketItem.amount - currentAmount;
    if (remain < amount) {
      return res.status(403).send({
        errors: [{ message: `You can transfer ${remain} tickets.` }]
      });
    }

    if (marketItem) {
      await models.Market.update({ amount: amount + marketItem.amount, price: price.toFixed(2) }, { where: {id: marketItem.id}})
    } else {
      await models.Market.create({ amount, price: price.toFixed(2), ticket_id, user_id: id })
    }
    res.status(200).send({
      data: { msg: 'success' } 
    });
  } catch (err) {
    logger.error('Error on transfering to market:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/delete/:market_id', async (req, res) => {
  const { market_id } = req.params;

  try {
    await models.Market.destroy({ where: { id: market_id } });
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

router.get('/', async (req, res) => {
  try {
		const marketTickets = await models.Market.findAll({
			nest: true,
			raw: false,
			attributes: MarketAttributes,
			include: MarketIncludes
		})
		res.status(200).send({
			data: marketTickets
		});
	} catch (err) {
		logger.error('Error on fetching market tickets:', err);
		res.status(500).send({
			errors: [err]
		});
	}
})


export default router;