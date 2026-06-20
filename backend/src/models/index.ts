import User from './User';
import Deployment from './Deployment';
import Log from './Log';
import Analysis from './Analysis';
import sequelize from '../config/database';

// Define associations
Deployment.hasMany(Log, {
  foreignKey: 'deploymentId',
  sourceKey: 'deploymentId',
  as: 'logs',
});

Log.belongsTo(Deployment, {
  foreignKey: 'deploymentId',
  targetKey: 'deploymentId',
  as: 'deployment',
});

Deployment.hasOne(Analysis, {
  foreignKey: 'deploymentId',
  sourceKey: 'deploymentId',
  as: 'analysis',
});

Analysis.belongsTo(Deployment, {
  foreignKey: 'deploymentId',
  targetKey: 'deploymentId',
  as: 'deployment',
});

export { sequelize, User, Deployment, Log, Analysis };
