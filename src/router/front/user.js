import { Router } from 'express';
import passport from 'passport';
import Joi from '@hapi/joi';
import models from '../../model';
import graph from '../../middleware/graph';
import logger from '../../middleware/logger';
import Sequelize from 'sequelize';

const router = Router();

const Op = Sequelize.Op;

const UserAttributes = ['id', 'first_name', 'last_name', 'photo']
const UserIncludes = [
	{
		model: models.Relation,
		as: 'followers',
		attributes: [ 'user_id' ],
	},
]

router.post('/search', passport.authenticate('jwt', { failWithError: true, session: false }), async (req, res) => {
	try {
		const { search_string } = req.body;
		const users = await models.User.findAll({
			nest: true,
			raw: false,
			attributes: UserAttributes,
			include: UserIncludes,
      where: Sequelize.where(Sequelize.fn("concat", Sequelize.col("first_name"), Sequelize.col("last_name")), {
        [Op.iLike]: `%${search_string}%`
      })
		})
		res.status(200).send({
			data: users
		});
	} catch (err) {
		logger.error('Error on fetching users:', err);
		res.status(500).send({
			errors: [err]
		});
	}
})

export default router;