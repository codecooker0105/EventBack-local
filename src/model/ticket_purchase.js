const ticketpurchase = (sequelize, DataTypes) => {
  const TicketPurchase = sequelize.define('ticket_purchase', {
    event_id: {
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
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      default: 1,
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

  return TicketPurchase;
};

export default ticketpurchase;