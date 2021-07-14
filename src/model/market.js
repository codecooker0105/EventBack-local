const market = (sequelize, DataTypes) => {
	const Market = sequelize.define('market', {
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: {
				notEmpty: true,
			},
    },
    ticket_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: {
				notEmpty: true,
			},
    },
		amount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: {
				notEmpty: true,
			}
		},
		price: {
			type: DataTypes.FLOAT,
			allowNull: false,
			validate: {
				notEmpty: true,
			}
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
  
	return Market;
};
  
export default market;