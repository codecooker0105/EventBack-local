const notificationtoken = (sequelize, DataTypes) => {
	const NotificationToken = sequelize.define('notification_token', {
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: {
				notEmpty: true,
			},
    },
    token: {
			type: DataTypes.TEXT,
			allowNull: false,
			validate: {
				notEmpty: true,
			},
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
  
	return NotificationToken;
};
  
export default notificationtoken;