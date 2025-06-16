
const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid'); 

module.exports = (sequelize) => {
  const Project = sequelize.define('Project', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(), 
      primaryKey: true,
      allowNull: false
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
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    goal_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    raised_amount: {
      type: DataTypes.DECIMAL(15, 2), 
      defaultValue: 0.00,
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATEONLY, 
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true, 
      },
    },
  }, {
    tableName: 'projects', 
    timestamps: true, 
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Project;
};