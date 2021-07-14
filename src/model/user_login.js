import Sequelize from 'sequelize';

import logger from '../middleware/logger';

const Op = Sequelize.Op;

const userLogin = (sequelize, DataTypes) => {
	const UserLogin = sequelize.define('user_login', {
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: {
				notEmpty: true,
			},
		},
		login_type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isNumeric: true
      },
      comment: '0 - web, 1 - mobile',
    },
		refresh_token: {
			type: DataTypes.TEXT,
			allowNull: false,
			validate: {
				notEmpty: true,
			},
		},
		lifetime: {
			type: DataTypes.BIGINT,
		},
		login: DataTypes.DATE,
		refresh: DataTypes.DATE,
		logout: DataTypes.DATE,
		status: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
			validate: {
				isNumeric: true
			},
			comment: '0 - login, 1 - refresh, 2 - timeout, 3 - logout',
		},
		createdAt: {
			field: 'create_date',
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		updatedAt: {
			field: 'update_date',
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	});

	UserLogin.beforeCreate(async userLogin => {
		try {
			await UserLogin.expireOldLogins(userLogin.user_id);
		} catch (e) {
			logger.error(`Error on expiring old refresh tokens: ${e}`)
		}

		userLogin.login = new Date().toLocaleString()
	});

	UserLogin.expireOldLogins = async function(user_id) {
		await UserLogin.update({ logout: new Date().toLocaleString(), status: 3 }, { where: { user_id, status: { [Op.lt]: 2 } }});
	};

	return UserLogin;
};

export default userLogin;