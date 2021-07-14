const event = (sequelize, DataTypes) => {
	const Event = sequelize.define('event', {
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
		description: {
			type: DataTypes.TEXT,
			allowNull: false,
			validate: {
				notEmpty: true,
			}
		},
		content: {
			type: DataTypes.TEXT,
			allowNull: false,
			validate: {
				notEmpty: true,
			}
		},
		online_event: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: {
				notEmpty: true,
			}
		},
		location: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				notEmpty: false,
			}
		},
		lat: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			default: 0,
			validate: {
				notEmpty: false,
			}
		},
		lng: {
			type: DataTypes.DOUBLE,
			allowNull: false,
			default: 0,
			validate: {
				notEmpty: false,
			}
		},
		total_ticket: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: {
				notEmpty: true,
			}
		},
		ticket_limit: {
			type: DataTypes.INTEGER,
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
		start_date: {
			field: 'create_date',
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		end_date: {
			field: 'create_date',
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		free_event: {
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
		restriction_age: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		restriction_dress: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		restriction_refund: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		restriction_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
			comment: '0 - not required, 1 - required'
		},
		restriction_cash: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
			comment: '0 - not accepted, 1 - accepted'
		},
		qrcode: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		status: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
			validate: {
				isNumeric: true
			},
			comment: '0 - active, 1 - inactive',
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
  
	return Event;
};
  
export default event;