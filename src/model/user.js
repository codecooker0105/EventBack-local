import bcrypt from 'bcryptjs';

const generatePasswordHash = function(password) {
	const saltRounds = 10;
	let salt = bcrypt.genSaltSync(saltRounds);
	let hash = bcrypt.hashSync(password, salt);
	return {hash, salt};
};

const user = (sequelize, DataTypes) => {
	const User = sequelize.define('user', {
		email: {
			type: DataTypes.STRING,
			unique: true,
			validate: {
				isEmail: true,
			},
		},
		first_name: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				notEmpty: true,
			},
		},
		last_name: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				notEmpty: true,
			},
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				notEmpty: true,
				len: [6, 200],
			},
		},
		photo: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		country_code: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		phonenumber: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		gender: {
			type: DataTypes.INTEGER,
			allowNull: true,
			default: 0, 
			comment: '0 - male, 1 - female',
		},
		age_range: {
			type: DataTypes.INTEGER,
			allowNull: true,
			default: 0, 
			comment: '0 - 10~20, 1 - 20~30, 2 - 30~40 3 - above',
		},
		address: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		preferences: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		cash: {
			type: DataTypes.FLOAT,
			allowNull: true,
			validate: {
				isNumeric: true
			},
			defaultValue: 0
		},
		salt: {
			type: DataTypes.STRING,
		},
		status: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
			validate: {
				isNumeric: true
			},
			comment: '0 - created, 1 - active, 2 - blocked, 3 - delete',
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

	User.findByLogin = async login => {
		let user = await User.findOne({
			where: { email: login },
		});

		return user;
	};

	User.beforeCreate(function(user, options) {
		const {hash, salt} = generatePasswordHash(user.password);
		user.password = hash
		user.salt = salt
	});

	User.beforeBulkUpdate(function(user, options) {
		if (user.attributes && user.attributes.password) {
			const {hash, salt} = generatePasswordHash(user.attributes.password);
			user.attributes.password = hash
			user.attributes.salt = salt
		}
	});

	User.prototype.validatePassword = function(password) {
		return bcrypt.compare(password, this.password);
	};

	return User;
};

export default user;