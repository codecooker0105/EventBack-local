import passport from 'passport';

import auth from './auth';
import event from './event';
import comment from './comment';
import reaction from './reaction';
import profile from './profile';
import ticket from './ticket';
import payment from './payment';
import relation from './relation';
import market from './market';
import notification from './notification';
import user from './user';
import community from './community';

export default function(app){
	// public routes
	app.use('/auth', auth);
	app.use('/event', event);
	app.use('/community', community);

	// private routes
	app.use('/comment', passport.authenticate('jwt', { failWithError: true, session: false }), comment);
	app.use('/reaction', passport.authenticate('jwt', { failWithError: true, session: false }), reaction);
	app.use('/profile', passport.authenticate('jwt', { failWithError: true, session: false }), profile);
	app.use('/ticket', passport.authenticate('jwt', { failWithError: true, session: false }), ticket);
	app.use('/payment', passport.authenticate('jwt', { failWithError: true, session: false }), payment);
	app.use('/relation', passport.authenticate('jwt', { failWithError: true, session: false }), relation);
	app.use('/market', passport.authenticate('jwt', { failWithError: true, session: false }), market);
	app.use('/notification', passport.authenticate('jwt', { failWithError: true, session: false }), notification);
	app.use('/user', passport.authenticate('jwt', { failWithError: true, session: false }), user);
}