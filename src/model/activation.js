const activation = (sequelize, DataTypes) => {
	const Activation = sequelize.define('activation', {
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: {
				notEmpty: true,
			},
		},
		code: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				notEmpty: true,
			},
		},
		hash: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				notEmpty: true,
			},
		},
		status: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
			validate: {
				isNumeric: true
			},
			comment: '0 - created, 1 - success, 2 - failed',
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
  
	return Activation;
};
  
export default activation;