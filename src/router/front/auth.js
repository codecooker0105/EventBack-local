import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import Joi from '@hapi/joi';
import models from '../../model';
import logger from '../../middleware/logger';
import config from '../../config';
import mailer from '../../middleware/mailer';
import graph from '../../middleware/graph';
import * as utils from '../../utils';

const router = Router();

const createToken = async (user, expiresIn) => {
	const { id, first_name, last_name, email, status, photo, country_code, phonenumber, gender, age_range, address, preferences, cash } = user;
	// return await jwt.sign({ id, first_name, last_name, email, status, photo, country_code, phonenumber, gender, age_range, address, preferences, cash }, config.secret_key, { expiresIn });
	return await jwt.sign({ id, first_name, last_name, email, status, photo, country_code, phonenumber, gender, age_range, address, preferences, cash }, config.secret_key, {});
};

const sendActivationMail = async (user) => {
	const { id, first_name, last_name, email } = user;
  
	const activation = {};
	activation.user_id = id;
	activation.code = utils.generateCode(config.activation_code_digit);
	activation.hash = await jwt.sign({
		activation_code: activation.code,
		email,
		time: new Date().getTime()
	}, config.secret_key, { expiresIn: config.activation_code_expiresin });
	activation.link = `${config.web_root_url}${config.activation_link_url}?hval=${activation.hash}`;
  
	try{
		await models.Activation.create(activation);
		
		await mailer.sendConfirmationEmail({
			first_name, last_name,
			email,
			activation_code: activation.code,
			activation_link: activation.link
		});
	} catch (err) {
		logger.error('Error on sending activation code:', err);
		throw err;
	}
}

const sendResetPasswordMail = async (user) => {
	const { id, first_name, last_name, email } = user;
  
	const activation = {};
	activation.user_id = id;
	activation.code = utils.generateCode(config.activation_code_digit);
	activation.hash = await jwt.sign({
		activation_code: activation.code,
		email,
		time: new Date().getTime()
	}, config.secret_key, { expiresIn: config.activation_code_expiresin });
	activation.link = `${config.web_root_url}${config.reset_password_link_url}?hval=${activation.hash}`;
  
	try{
		await models.Activation.create(activation);
	  
		await mailer.sendResetPasswordMail({
			first_name, last_name,
			email,
			activation_code: activation.code,
			activation_link: activation.link
		});
	} catch (err) {
		logger.error('Error on sending activation code:', err);
		throw err;
	}
  }

const checkActivation = async (activation) => {
	const sendDate = new Date(activation.createdAt),
	diff = (new Date()).getTime() - sendDate.getTime();
  
	if (activation.status === 0 && diff / 1000 < config.activation_code_expiresin) {
	  	return true
	} else {
		await models.Activation.update({ status: 2 }, { where: { id: activation.id } })
		return false
	}
}

const activeUser = async (user, activation) => {
	let transaction;
  
	try {
		transaction = await models.transaction();
	
		await models.User.update({ status: 1}, { where: { id: user.id }, transaction });
		await models.Activation.update({ status: 1 }, { where: { id: activation.id }, transaction });
	
		await transaction.commit();
	} catch (err) {
		logger.error('Error on active user:', err);
		if (transaction) await transaction.rollback();
		throw err;
	}
}

router.post('/login', passport.authenticate('local', { failWithError: true }), async (req, res) => {
	try {
		if (req.user.status >= 2) {
			return res.status(401).send({
				errors: [{ message: 'This account is blocked, please contact to support.' }]
			});
		} else if (req.user.status < 1) {
			const { id, first_name, last_name, email, photo, status, country_code, phonenumber, gender, age_range, address, preferences, cash } = req.user;
			return res.status(401).send({
				data: { user: { id, first_name, last_name, email, photo, status, country_code, phonenumber, gender, age_range, address, preferences, cash } },
				errors: [{ message: 'This account isn\'t active. Please check our confirm email in your mailbox or resend.' }]
			});
		}
		
		const { login_type } = req.body;
		const { id, first_name, last_name, email, photo, status, country_code, phonenumber, gender, age_range, address, preferences, cash } = req.user;
	
		const token = await createToken(req.user, config.token_expiresin)
		const refresh_token = await createToken(req.user, config.refresh_token_expiresin)
	
		await models.UserLogin.create({
			user_id: id,
			refresh_token,
			login_type
		})
	
		res.status(200).send({
			data: { user: { id, first_name, last_name, email, photo, status, country_code, phonenumber, gender, age_range, address, preferences, cash }, token, refresh_token }
		});
	} catch (err) {
		logger.error('Error on login:', err);
		res.status(500).send({
			errors: [err]
		});
	}
});

router.post('/signup', async (req, res) => {
	const { email, first_name, last_name, password, login_type } = req.body
  
	const schema = Joi.object().keys({
		first_name: Joi.string().required(),
		last_name: Joi.string().required(),
		password: Joi.string().min(3).max(30).required(),
		email: Joi.string().email({ minDomainSegments: 2 }).min(3).max(30).required(),
		login_type: Joi.number().required(),
	});
  
	try {
		Joi.assert({ email, first_name, last_name, password, login_type }, schema, { abortEarly: false });
	} catch (err) {
		const errors = err.details.map(error => ({ message: error.message }))
		return res.status(403).send({
			errors
		});
	}
  
	try {
		const duplication = await models.User.findOne({ where: { email } });
		if (duplication) {
			return res.status(403).send({
				errors: [{ message: `Email already exists` }]
			});
		}
  
		const result = await models.User.create({
			first_name, last_name,
			password,
			email,
			status: 0,
			photo: config.default_avatar
		})
		const user = result.get({ plain: true });
	
		const token = await createToken(user, config.token_expiresin)
		const refresh_token = await createToken(user, config.refresh_token_expiresin)
	
		const { id, photo, status, country_code, phonenumber, gender, age_range, address, preferences, cash } = user
	
		await models.UserLogin.create({
			user_id: id,
			refresh_token,
			login_type
		})

		sendActivationMail(user)
	
		res.status(200).send({
			data: { user: { id, email, first_name, last_name, photo, status, country_code, phonenumber, gender, age_range, address, preferences, cash }, token, refresh_token }
		});
	} catch (err) {
		logger.error('Error on signup:', err);
		res.status(500).send({
			errors: [err]
		});
	}
});

router.post('/request_activation', async (req, res) => {
	const { email } = req.body
  
	const schema = Joi.object().keys({
	  	email: Joi.string().email({ minDomainSegments: 2 }).min(3).max(30).required(),
	});
  
	try {
	  	Joi.assert({ email }, schema, { abortEarly: false });
	} catch (err) {
		const errors = err.details.map(error => ({ message: error.message }))
		return res.status(403).send({
			errors
		});
	}
  
	try {
		const user = await models.User.findOne({where: { email }});
		if (!user) {
			return res.status(403).send({
				errors: [{ message: `Your email isn't registered` }]
			});
		}
		
		if (user.status != 0) {
			return res.status(403).send({
				errors: [{ message: `Your account is already activated. Please try to login.` }]
			});
		}
	
		sendActivationMail(user);
	
		res.status(200).send({
			data: { message: `Activation code is sent to ${email}` }
		});
	} catch (err) {
		logger.error('Error on requesting activation code:', err);
		res.status(500).send({
			errors: [err]
		});
	}
});

router.post('/activate', async (req, res) => {
	const { email, code, login_type } = req.body
  
	const schema = Joi.object().keys({
		email: Joi.string().email({ minDomainSegments: 2 }).min(3).max(30).required(),
		code: Joi.string().min(6).max(10).required(),
		login_type: Joi.number().required(),
	});
  
	try {
		Joi.assert({ email, code, login_type }, schema, { abortEarly: false });
	} catch (err) {
		const errors = err.details.map(error => ({ message: error.message }))
		return res.status(403).send({
			errors
		});
	}
  
	try {
		const user = await models.User.findOne({ where: { email } });
		if (!user) {
			return res.status(403).send({
				errors: [{ message: `Your email isn't registered` }]
			});
		}
		
		if (user.status == 1) {
			return res.status(403).send({
				errors: [{ message: `Your account is already activated.` }]
			});
		} else if (user.status != 0) {
			return res.status(403).send({
				errors: [{ message: `Unable to active this account. Please contact to support.` }]
			});
		}
	
		const activation = await models.Activation.findOne({
			where: { user_id: user.id, code },
			order: [ ['create_date', 'DESC'], ],
		});
		if (!activation) {
			return res.status(403).send({
				errors: [{ message: `Activation code is incorrect` }]
			});
		}
		
		const isValid = await checkActivation(activation)
		if (!isValid) {
			return res.status(403).send({
				errors: [{ message: `Activation data is expired. Please request activation again.` }]
			});
		}
		
		await activeUser(user, activation)

		graph.addUser(user.get({ plain: true }))
	
		const token = await createToken(user, config.token_expiresin)
		const refresh_token = await createToken(user, config.refresh_token_expiresin)
	
		const { id, first_name, last_name, photo, status, country_code, phonenumber, gender, age_range, address, preferences, cash } = user;
	
		await models.UserLogin.create({
			user_id: id,
			refresh_token,
			login_type
		})
	
		res.status(200).send({
			data: { user: { id, first_name, last_name, email, photo, status, country_code, phonenumber, gender, age_range, address, preferences, cash }, token, refresh_token }
		});
	} catch (err) {
		logger.error('Error on activate user:', err);
		res.status(500).send({
			errors: [err]
		});
	}
});

router.post('/request_reset_password', async (req, res) => {
	const { email } = req.body
  
	const schema = Joi.object().keys({
	 	email: Joi.string().email({ minDomainSegments: 2 }).min(3).max(30).required(),
	});
  
	try {
	  	Joi.assert({ email }, schema, { abortEarly: false });
	} catch (err) {
		const errors = err.details.map(error => ({ message: error.message }))
		return res.status(403).send({
			errors
		});
	}
  
	try {
		const user = await models.User.findOne({where: { email }});
		if (!user) {
			return res.status(403).send({
				errors: [{ message: `Your email isn't registered` }]
			});
		}
		
		if (user.status == 0) {
			return res.status(403).send({
				errors: [{ message: `Your account isn't activated. Please activate that first` }]
			});
		} else if (user.status != 1) {
			return res.status(403).send({
				errors: [{ message: `Your account has a problem. Please contact to support.` }]
			});
		}
	
		sendResetPasswordMail(user);
	
		res.status(200).send({
			data: { message: `Reset password email is sent to ${email}` }
		});
	} catch (err) {
		logger.error('Error on requesting reset password:', err);
		res.status(500).send({
			errors: [err]
		});
	}
});

router.post('/reset_password', async (req, res) => {
	const { email, code, password } = req.body
  
	const schema = Joi.object().keys({
		email: Joi.string().email({ minDomainSegments: 2 }).min(3).max(30).required(),
		code: Joi.string().min(6).max(10).required(),
		password: Joi.string().min(3).max(30).required(),
	});
  
	try {
	  Joi.assert({ email, code, password }, schema, { abortEarly: false });
	} catch (err) {
		const errors = err.details.map(error => ({ message: error.message }))
		return res.status(403).send({
			errors
		});
	}
  
	try {
		const user = await models.User.findOne({ where: { email } });
		if (!user) {
			return res.status(403).send({
				errors: [{ message: `Your email isn't registered` }]
			});
		}
		
		if (user.status == 0) {
			return res.status(403).send({
				errors: [{ message: `Your account isn't activated. Please activate that first` }]
			});
		} else if (user.status != 1) {
			return res.status(403).send({
				errors: [{ message: `Your account has a problem. Please contact to support.` }]
			});
		}
  
		const activation = await models.Activation.findOne({
			where: { user_id: user.id, code },
			order: [ ['create_date', 'DESC'], ],
		});
		if (!activation) {
			return res.status(403).send({
				errors: [{ message: `Code is incorrect` }]
			});
		}
	  
		const isCodeValid = await checkActivation(activation)
	
		if (!isCodeValid) {
			return res.status(403).send({
				errors: [{ message: `Code is expired. Please request again.` }]
			});
		}
  
	  	await models.User.update({ password }, { where: { id: user.id } });
  
		res.status(200).send({
			data: {
				message: 'Password is changed successfully'
			}
		});
	} catch (err) {
		logger.error('Error on reset password:', err);
		res.status(500).send({
			errors: [err]
		});
	}
});

router.post('/token', async (req, res) => {
	const { refresh_token } = req.body;
  
	const schema = Joi.object().keys({
	  	refresh_token: Joi.string().required(),
	});
  
	try {
	  	Joi.assert({ refresh_token }, schema, { abortEarly: false });
	} catch (err) {
		const errors = err.details.map(error => ({ message: error.message }))
		return res.status(403).send({
			errors
		});
	}
  
	try {
		const decoded = jwt.verify(refresh_token, config.secret_key, { ignoreExpiration: true });
		const user = await models.User.findByPk(decoded.id);
	
		const userLogin = await models.UserLogin.findOne({ where: { user_id: user.id, refresh_token } });
		if (!userLogin) {
			return res.status(403).send({
				errors: [{ message: `No account found with this refresh token: ${refresh_token}` }]
			});
		} else if (userLogin.status > 1) {
			return res.status(403).send({
				errors: [{ message: `refresh token invalid` }]
			});
		}
	
		if (decoded.exp <= Math.floor(Date.now() / 1000)) {
			await userLogin.update({ logout: new Date().toLocaleString(), status: 2 });
			return res.status(401).send({
				errors: [{message: 'refresh token expired'}]
			});
		}
	
		const token = await createToken(user, config.token_expiresin)
		const new_refresh_token = await createToken(user, config.refresh_token_expiresin)
		
		await userLogin.update({ refresh_token: new_refresh_token, refresh: new Date().toLocaleString(), status: 1 });
	
		const { id, first_name, last_name, email, photo, status, country_code, phonenumber, gender, age_range, address, preferences, cash } = user;
	
		res.status(200).send({
			data: { user: { id, first_name, last_name, email, photo, status, country_code, phonenumber, gender, age_range, address, preferences, cash }, token, refresh_token: new_refresh_token }
		});
	} catch (err) {
		logger.error('Error on update token:', err);
		res.status(500).send({
			errors: [err]
		});
	}
});

router.post('/logout', passport.authenticate('jwt', { failWithError: true, session: false }), async (req, res) => {
  const { refresh_token } = req.body;

  const schema = Joi.object().keys({
    refresh_token: Joi.string().required(),
  });

  try {
    Joi.assert({ refresh_token }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    const { id } = req.user;
    const userLogin = await models.UserLogin.findOne({ where: { user_id: id, refresh_token } })

    if (!userLogin) {
      return res.status(403).send({
        errors: [{ message: `No account found with this refresh token: ${refresh_token}` }]
      });
    }

    await userLogin.update({ status: 3 });

    req.logout();
    res.status(200).send({ data: 'Success' });
  } catch (err) {
    logger.error('Error on logout:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/social', async (req, res) => {
	let { type, social_id, email, first_name, last_name, photo, login_type } = req.body;
  
	const schema = Joi.object().keys({
		type: Joi.number().required(),
		email: Joi.string().required(),
		first_name: Joi.string().required(),
		login_type: Joi.number().required(),
	});
  
	try {
		Joi.assert({ type, email, first_name, login_type }, schema, { abortEarly: false });
	} catch (err) {
		const errors = err.details.map(error => ({ message: error.message }))
		return res.status(403).send({
			errors
		});
	}
  
	try {
		let user = {};
		const social_user = await models.SocialUser.findOne({ where: { type, social_id }});
		let user_id = 0;
		if (social_user) {
			user = await models.User.findOne({ where: {id: social_user.user_id}});
			if (user.status >= 2) {
				return res.status(401).send({
					errors: [{ message: 'This account is blocked, please contact to support.' }]
				});
			}
			user_id = user.id;
		} else {
			if (email && email.length > 0) {
				const checkEmail = await models.User.findOne({ where: {email}});
				if (checkEmail) {
					user = checkEmail;
					user_id = user.id;
				}
			}
			if (user_id === 0) {
				const result = await models.User.create({
					first_name: req.body.first_name, 
					last_name: req.body.last_name,
					password: Math.random().toString(36).slice(-8),
					email: req.body.email,
					status: 1,
					photo: req.body.photo || config.default_avatar
				})
				user = result.get({ plain: true });
				user_id = user.id;
			}

			await models.SocialUser.create({ user_id, social_id, type})
		}
	
		const token = await createToken(user, config.token_expiresin)
		const refresh_token = await createToken(user, config.refresh_token_expiresin)

		await models.UserLogin.create({
			user_id,
			refresh_token,
			login_type
		})
	
		let { id, first_name, last_name, email, photo, status, country_code, phonenumber, gender, age_range, address, preferences, cash } = user;
	
		res.status(200).send({
			data: { user: { id, first_name, last_name, email, photo, status, country_code, phonenumber, gender, age_range, address, preferences, cash }, token, refresh_token }
		});
	} catch (err) {
		logger.error('Error on update token:', err);
		res.status(500).send({
			errors: [err]
		});
	}
});

export default router;