const { Sequelize } = require('sequelize');
const config = require('./config');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: dbConfig.logging,
  define: {
    timestamps: true, 
    underscored: true, 
    freezeTableName: true, 
  }
});

const User = require('../models/user')(sequelize);
const Charity = require('../models/charity')(sequelize);
const Project = require('../models/project')(sequelize);
const Donation = require('../models/donation')(sequelize);
const ImpactReport = require('../models/impactReport')(sequelize);

User.hasOne(Charity, { foreignKey: 'id', onDelete: 'CASCADE', as: 'charityDetails' });
Charity.belongsTo(User, { foreignKey: 'id', as: 'userDetails' });

Charity.hasMany(Project, { foreignKey: 'charity_id', onDelete: 'CASCADE', as: 'projects' });
Project.belongsTo(Charity, { foreignKey: 'charity_id', as: 'charity' });

User.hasMany(Donation, { foreignKey: 'user_id', onDelete: 'SET NULL', as: 'donations' });
Donation.belongsTo(User, { foreignKey: 'user_id', as: 'donor' });

Charity.hasMany(Donation, { foreignKey: 'charity_id', onDelete: 'CASCADE', as: 'receivedDonations' });
Donation.belongsTo(Charity, { foreignKey: 'charity_id', as: 'charity' });

Project.hasMany(Donation, { foreignKey: 'project_id', onDelete: 'SET NULL', as: 'projectDonations' });
Donation.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

Charity.hasMany(ImpactReport, { foreignKey: 'charity_id', onDelete: 'CASCADE', as: 'impactReports' });
ImpactReport.belongsTo(Charity, { foreignKey: 'charity_id', as: 'charity' });

Project.hasMany(ImpactReport, { foreignKey: 'project_id', onDelete: 'SET NULL', as: 'projectImpactReports' });
ImpactReport.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

module.exports = sequelize;
module.exports.User = User;
module.exports.Charity = Charity;
module.exports.Project = Project;
module.exports.Donation = Donation;
module.exports.ImpactReport = ImpactReport;