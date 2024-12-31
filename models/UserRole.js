import { DataTypes, Model } from 'sequelize';
import db from '../config/databaseConnection.js';

const sequelize = db.sequelize;

class UserRole extends Model {}

UserRole.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    timestamps: true,
  },
);

UserRole.associate = (models) => {
  UserRole.belongsTo(models.Role, {
    onDelete: 'CASCADE',
  });
  UserRole.belongsTo(models.User, {
    onDelete: 'CASCADE',
  });
};

export default UserRole;
