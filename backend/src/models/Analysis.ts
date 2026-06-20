import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Analysis extends Model {
  public id!: number;
  public deploymentId!: string;
  public rootCause!: string;
  public severity!: 'LOW' | 'MEDIUM' | 'HIGH';
  public suggestion!: string;
  public analyzedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Analysis.init(
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
    rootCause: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'root_cause',
    },
    severity: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
      allowNull: false,
    },
    suggestion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    analyzedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'analyzed_at',
    },
  },
  {
    sequelize,
    tableName: 'analysis',
    timestamps: true,
    underscored: true,
  }
);

export default Analysis;
