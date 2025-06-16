
const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const ImpactReport = sequelize.define('ImpactReport', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
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
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    report_date: {
      type: DataTypes.DATEONLY, 
      allowNull: false,
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true, 
      },
    },
  }, {
    tableName: 'impact_reports', 
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return ImpactReport;
};