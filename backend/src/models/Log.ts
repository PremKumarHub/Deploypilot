import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Log extends Model {
  public id!: number;
  public deploymentId!: string;
  public logType!: 'BUILD' | 'DOCKER' | 'RUNTIME';
  public content!: string;
  public timestamp!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Log.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    deploymentId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'deployment_id',
    },
    logType: {
      type: DataTypes.ENUM('BUILD', 'DOCKER', 'RUNTIME'),
      allowNull: false,
      field: 'log_type',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'logs',
    timestamps: true,
    underscored: true,
  }
);

export default Log;
