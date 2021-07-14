const reaction = (sequelize, DataTypes) => {
  const Reaction = sequelize.define('reaction', {
    type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '0 - event, 1 - comment',
      validate: {
        isNumeric: true
      },
    },
    relation_id: {
      type: DataTypes.INTEGER,
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
    value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '0 - none, 1 - like, 2 - dislike',
      validate: {
        isNumeric: true
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

  return Reaction;
};

export default reaction;