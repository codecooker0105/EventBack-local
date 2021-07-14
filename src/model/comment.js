const comment = (sequelize, DataTypes) => {
  const Comment = sequelize.define('comment', {
    relation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isNumeric: true
      },
		},
		type: {
			type: DataTypes.INTEGER,
			default: 0, // 0 - event, 1 - community
      allowNull: false,
      validate: {
        isNumeric: true
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isNumeric: true
      },
    },
    text: {
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

  return Comment;
};

export default comment;