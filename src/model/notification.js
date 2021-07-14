const notification = (sequelize, DataTypes) => {
	const Notification = sequelize.define('notification', {
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: {
				notEmpty: true,
			},
    },
    title: {
			type: DataTypes.TEXT,
			allowNull: false,
			validate: {
				notEmpty: true,
			},
    },
    content: {
			type: DataTypes.TEXT,
			allowNull: false,
			validate: {
				notEmpty: true,
			},
    },
    read: {
      type: DataTypes.INTEGER,
      allowNull: false,
      default: 0,
      comment: '0 - unread, 1 - read',
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
  })
  
	return Notification;
};
  
export default notification;