import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

import config from '../../config';
import models from '../../model';

const passportHandler = passport.initialize()

passport.use('local', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password'
  	},  (email, password, done) => {
		return models.User.findByLogin(email)
		.then(user => {
			if (!user) {
				return done({status: 401, message: 'Incorrect email or password.'}, false);
			}
			user.validatePassword(password).then(res => {
				if (res) {
					done(null, user, {message: 'Logged In Successfully'})
				} else {
					return done({status: 401, message: 'Incorrect email or password.'}, false);
				}
			}).catch(err => done(err))
		})
		.catch(err => done(err));
	}
));

var jwtOpts = {
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	secretOrKey: config.secret_key,
	ignoreExpiration: true,
};
passport.use('jwt', new JwtStrategy(jwtOpts, function(jwt_payload, done) {
	// if (jwt_payload.exp <= Math.floor(Date.now() / 1000)) {
	// 	return done({status: 401, message: 'jwt expired'}, false);
	// }

	models.User.findOne({ where: { email: jwt_payload.email } }).then(user => {
		return user ? done(null, user) : done(null, false);
	}).catch(err => {
		if (err) {
			return done(err, false);
		}
	});
}));

passport.serializeUser(function(user, done) {
  	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	models.User.findByPk(id).then(user => {
		return user ? done(null, user) : done(null, false);
	}).catch(err => {
		if (err) {
			return done(err, false);
		}
	});
});

export default passportHandler;