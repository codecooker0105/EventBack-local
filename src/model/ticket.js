const ticket = (sequelize, DataTypes) => {
  const Ticket = sequelize.define('ticket', {
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
    price: {
			type: DataTypes.FLOAT,
      allowNull: false,
      default: 0,
			validate: {
				notEmpty: true,
			}
		},
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '0 - active, 1 - deleted',
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

  return Ticket;
};

export default ticket;