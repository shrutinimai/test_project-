
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Charity = sequelize.define('Charity', {
    id: { 
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, 
    },
    registration_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true, 
    },
    mission: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    contact_email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true, 
      },
    },
    logo_url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true, 
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'), 
      defaultValue: 'pending',
      allowNull: false,
    },
    current_goal: {
      type: DataTypes.DECIMAL(15, 2), 
      defaultValue: 0.00,
      allowNull: false,
    },
    raised_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      allowNull: false,
    },
  }, {
    tableName: 'charities', 

    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Charity;
};