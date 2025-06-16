
const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Donation = sequelize.define('Donation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true, 
      references: {
        model: 'users', 
        key: 'id',
      },
      onDelete: 'SET NULL', 
    },
    charity_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'charities', 
        key: 'id',
      },
      onDelete: 'CASCADE', 
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: true, 
      references: {
        model: 'projects',
        key: 'id',
      },
      onDelete: 'SET NULL', 
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3), 
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'), 
      defaultValue: 'pending',
      allowNull: false,
    },
    transaction_id: {
      type: DataTypes.STRING,
      unique: true, 
      allowNull: true,
    },
    is_anonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    donated_at: {
      type: DataTypes.DATE, 
      allowNull: true, 
    },
    receipt_url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true, 
      },
    },
  }, {
    tableName: 'donations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Donation;
};