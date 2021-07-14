import Sequelize from 'sequelize';

import config from '../config';

import activation from './activation';
import user from './user';
import userLogin from './user_login';
import event from './event';
import comment from './comment';
import reaction from './reaction';
import ticket from './ticket';
import paymenthistory from './payment_history';
import ticketpurchase from './ticket_purchase';
import relation from './relation';
import market from './market';
import notificationtoken from './notification_token';
import notification from './notification';
import socialuser from './social_user';
import attend from './attend';
import community from './community';

let sequelize = new Sequelize(
	config.db_name,
	config.db_user,
	config.db_pass,
	{
		host: config.db_host,
		port: config.db_port,
		dialect: config.db_dialect,
		pool: {
			max: 20,
			min: 0,
			idle: 10000
		},
		logging: false,
	},
);

const models = {};
models.Activation = activation(sequelize, Sequelize)
models.User = user(sequelize, Sequelize)
models.UserLogin = userLogin(sequelize, Sequelize)
models.Event = event(sequelize, Sequelize)
models.Comment = comment(sequelize, Sequelize)
models.Reaction = reaction(sequelize, Sequelize)
models.Ticket = ticket(sequelize, Sequelize)
models.PaymentHistory = paymenthistory(sequelize, Sequelize)
models.TicketPurchase = ticketpurchase(sequelize,Sequelize)
models.Relation = relation(sequelize, Sequelize)
models.Market = market(sequelize, Sequelize)
models.NotificationToken = notificationtoken(sequelize, Sequelize)
models.Notification = notification(sequelize, Sequelize)
models.SocialUser = socialuser(sequelize, Sequelize)
models.Attend = attend(sequelize, Sequelize)
models.Community = community(sequelize, Sequelize)

models.User.hasMany(models.UserLogin, { foreignKey: 'user_id' })
models.UserLogin.belongsTo(models.User, { foreignKey: 'user_id' })

models.User.hasMany(models.Comment, { as: 'comments', foreignKey: 'user_id' })
models.Comment.belongsTo(models.User, { as: 'user', foreignKey: 'user_id' })

models.User.hasMany(models.Reaction, { as: 'reactions', foreignKey: 'user_id' })
models.Reaction.belongsTo(models.User, { as: 'user', foreignKey: 'user_id' })

models.User.hasMany(models.Ticket, { as: 'tickets', foreignKey: 'user_id' })
models.Ticket.belongsTo(models.User, { as: 'owner', foreignKey: 'user_id' })

models.User.hasMany(models.TicketPurchase, { as: 'purchase_histories', foreignKey: 'user_id' })
models.TicketPurchase.belongsTo(models.User, { as: 'buyer', foreignKey: 'user_id' })

models.User.hasMany(models.Market, { as: 'user_tickets', foreignKey: 'user_id' })
models.Market.belongsTo(models.User, { as: 'owner', foreignKey: 'user_id' })

models.User.hasOne(models.NotificationToken, { as: 'my_notification_token', foreignKey: 'user_id' })
models.NotificationToken.belongsTo(models.User, { as: 'user', foreignKey: 'user_id' })

models.User.hasMany(models.Notification, { as: 'my_notifications', foreignKey: 'user_id' })
models.Notification.belongsTo(models.User, { as: 'user', foreignKey: 'user_id' })

models.User.hasMany(models.PaymentHistory, { as: 'payment_historys', foreignKey: 'user_id' })
models.PaymentHistory.belongsTo(models.User, { as: 'user', foreignKey: 'user_id' })
models.User.hasMany(models.PaymentHistory, { as: 'payment_related_historys', foreignKey: 'related_user_id' })
models.PaymentHistory.belongsTo(models.User, { as: 'related_user', foreignKey: 'related_user_id' })

models.User.hasMany(models.Event, { as: 'events', foreignKey: 'user_id' })
models.Event.belongsTo(models.User, { as: 'creator', foreignKey: 'user_id' })
models.Event.hasMany(models.Comment, { as: 'comments', foreignKey: 'relation_id' })
models.Comment.belongsTo(models.Event, { foreignKey: 'relation_id' })
models.Event.hasMany(models.Reaction, { as: 'likes', foreignKey: 'relation_id', constraints: false })
models.Event.hasMany(models.Reaction, { as: 'dislikes', foreignKey: 'relation_id', constraints: false })
models.Reaction.belongsTo(models.Event, { foreignKey: 'relation_id', constraints: false })

models.Event.hasMany(models.Ticket, { as: 'tickets', foreignKey: 'event_id' })
models.Ticket.belongsTo(models.Event, { as: 'eventinfo', foreignKey: 'event_id' })

models.Event.hasMany(models.TicketPurchase, { as: 'purchase_histories', foreignKey: 'event_id' })
models.TicketPurchase.belongsTo(models.Event, { as: 'eventinfo', foreignKey: 'event_id' })

models.User.hasMany(models.Relation, { as: 'followers', foreignKey: 'user_id' })
models.Relation.belongsTo(models.User, { as: 'user_info', foreignKey: 'user_id' })
models.User.hasMany(models.Relation, { as: 'following', foreignKey: 'follower_id' })
models.Relation.belongsTo(models.User, { as: 'follower', foreignKey: 'follower_id' })

models.Ticket.hasMany(models.Market, { as: 'on_market', foreignKey: 'ticket_id' })
models.Market.belongsTo(models.Ticket, { as: 'ticket_info', foreignKey: 'ticket_id' })

models.Event.hasMany(models.Attend, { as: 'attenders', foreignKey: 'event_id' })
models.Attend.belongsTo(models.Event, { as: 'event_info', foreignKey: 'event_id' })

models.Community.hasMany(models.Comment, { as: 'comments', foreignKey: 'relation_id' })
models.Comment.belongsTo(models.Community, { foreignKey: 'relation_id' })

models.transaction = async (option) => {
	return await sequelize.transaction(option)
}

Object.keys(models).forEach(key => {
	if ('associate' in models[key]) {
	  models[key].associate(models);
	}
});
  
export { sequelize };
  
export default models;