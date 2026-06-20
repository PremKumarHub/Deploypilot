import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Deployment extends Model {
  public id!: number;
  public deploymentId!: string;
  public status!: 'PENDING' | 'SUCCESS' | 'FAILED';
  public duration!: string | null;
  public branch!: string | null;
  public commitHash!: string | null;
  public repo!: string | null;
  public startedAt!: Date | null;
  public completedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Deployment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    deploymentId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'deployment_id',
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED'),
      defaultValue: 'PENDING',
    },
    duration: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    branch: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    commitHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'commit_hash',
    },
    repo: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'started_at',
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
    },
  },
  {
    sequelize,
    tableName: 'deployments',
    timestamps: true,
    underscored: true,
  }
);

export default Deployment;
