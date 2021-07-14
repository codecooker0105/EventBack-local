const community = (sequelize, DataTypes) => {
	const Community = sequelize.define('community', {
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: {
				notEmpty: true,
			},
		},
		title: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				notEmpty: true,
			},
		},
		content: {
			type: DataTypes.TEXT('long'),
			allowNull: false,
			validate: {
				notEmpty: true,
			}
		},
		poster: {
			type: DataTypes.STRING,
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
  
	return Community;
};
  
export default community;