import { Router } from 'express';
import models from '../../model';
import logger from '../../middleware/logger';
import Sequelize from 'sequelize';

const router = Router();

const Op = Sequelize.Op;

const PaymentHistoryAttributes = ['id', 'user_id', 'related_user_id', 'amount', 'type', 'description', 'createdAt', 'updatedAt']
const PaymentHistoryIncludes = [
  {
		model: models.User,
    as: 'related_user',
		attributes: [ 'id', 'first_name', 'last_name', 'photo' ],
	},
]

router.get('/history', async (req, res) => {
  const { id } = req.user;
	try {
		const tickets = await models.PaymentHistory.findAll({
			nest: true,
			raw: false,
			attributes: PaymentHistoryAttributes,
      include: PaymentHistoryIncludes,
      where: {
        user_id: id
      },
      order: [ ['id', 'DESC'], ],
		})
		res.status(200).send({
			data: tickets
		});
	} catch (err) {
		logger.error('Error on fetching payment history:', err);
		res.status(500).send({
			errors: [err]
		});
	}
})

router.get('/cash', async (req, res) => {
  const { id } = req.user;
	try {
    const user = await models.User.findByPk(id);
		res.status(200).send({
			data: { cash: user.cash }
		});
	} catch (err) {
		logger.error('Error on gettinc user cash:', err);
		res.status(500).send({
			errors: [err]
		});
	}
})

export default router;