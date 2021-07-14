import { Router } from 'express';
import passport from 'passport';
import Joi from '@hapi/joi';
import models from '../../model';
import logger from '../../middleware/logger';
import Sequelize from 'sequelize';

const router = Router();

const Op = Sequelize.Op;

const CommunityAttributes = ['id', 'user_id', 'title', 'content', 'poster', 'createdAt', 'updatedAt']
const CommunityIncludes = [
	{
    model: models.Comment,
    attributes: ['id', 'relation_id', 'text', 'user_id', 'createdAt', 'updatedAt'],
		as: 'comments',
		required: false,
		where: {
			type: 1
		},
    include: [
      {
        model: models.User,
        attributes: ['id', 'first_name', 'last_name', 'photo'],
        as: 'user'
			}
    ]
	}
]

router.get('/', async (req, res) => {
	try {
		const communities = await models.Community.findAll({
			nest: true,
			raw: false,
			attributes: CommunityAttributes,
			include: CommunityIncludes,
		})
		res.status(200).send({
			data: communities
		});
	} catch (err) {
		logger.error('Error on fetching communities:', err);
		res.status(500).send({
			errors: [err]
		});
	}
})

router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const community = await models.Community.findOne({
			attributes: CommunityAttributes,
			include: CommunityIncludes,
			where: { id }
		})
		res.status(200).send({
			data: community
		});
	} catch (err) {
		logger.error('Error on fetching community:', err);
		res.status(500).send({
			errors: [err]
		});
	}
})

router.post('/', passport.authenticate('jwt', { failWithError: true, session: false }), async (req, res) => {
	const { title, content, poster } = req.body;
	const { id } = req.user;
	const schema = Joi.object().keys({
		title: Joi.string().required(),
		content: Joi.string().required(),
		poster: Joi.string().required(),
	});
  
	try {
		Joi.assert({ title, content, poster }, schema, { abortEarly: false });
	} catch (err) {
		const errors = err.details.map(error => ({ message: error.message }))
		return res.status(403).send({
			errors
		});
	}

	try {
		const result = await models.Community.create({
			user_id: id,
			title, content, poster
		})
		const community = result.get({ plain: true });
		
		res.status(200).send({
			data: { community }
		});
	} catch (err) {
		logger.error('Error on creating community:', err);
		res.status(500).send({
			errors: [err]
		});
	}
})

export default router;