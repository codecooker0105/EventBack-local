const socialuser = (sequelize, DataTypes) => {
  const SocialUser = sequelize.define('socialuser', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isNumeric: true
      },
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '0 - google, 1-fb, 2-apple',
      validate: {
        isNumeric: true
      },
    },
    social_id: {
      type: DataTypes.TEXT,
      allowNull: false,
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

  return SocialUser;
};

export default socialuser;