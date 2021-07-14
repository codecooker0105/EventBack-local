import { Router } from 'express';
import Joi from '@hapi/joi';
import models from '../../model';
import logger from '../../middleware/logger';

const router = Router();

router.post('/', async (req, res) => {
  const { first_name, last_name, photo, address, country_code, phonenumber, gender, age_range, preferences } = req.body
  const { id } = req.user;
  
  const schema = Joi.object().keys({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    photo: Joi.string().uri({allowRelative: true}).allow('', null),
    address: Joi.string().allow('', null),
    country_code: Joi.string().max(3).required(),
    phonenumber: Joi.string().max(20).allow('', null),
    gender: Joi.number().min(0).max(1).required(),
    age_range: Joi.number().min(0).max(3).required(),
    preferences: Joi.string().allow('', null),
  });

  try {
    Joi.assert({ first_name, last_name, photo, address, country_code, phonenumber, gender, age_range, preferences }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    await models.User.update({
      first_name, last_name,
      photo,
      address: address || '',
      country_code,
      phonenumber: phonenumber || '',
      gender,
      age_range,
      preferences: preferences || '',
    }, { where: { id } });
    res.status(200).send({
      data: { msg: 'Success' }
    });
  } catch (err) {
    logger.error('Error on updating user:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

export default router;