const paymenthistory = (sequelize, DataTypes) => {
  const PaymentHistory = sequelize.define('payment_history', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isNumeric: true
      },
    },
    related_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isNumeric: true
      },
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      default: 0,
      validate: {
        isNumeric: true
      },
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isNumeric: true
      },
      default: 0,
      comment: '0 - in, 1 - out'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
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

  return PaymentHistory;
};

export default paymenthistory;