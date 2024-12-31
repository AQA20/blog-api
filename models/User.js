// User.js
import { DataTypes, Model } from 'sequelize';
import db from '../config/databaseConnection.js';
import bcrypt from 'bcryptjs';
import UserRole from './UserRole.js';
import Role from './Role.js';
import Permission from './Permission.js';
import jwt from 'jsonwebtoken';

const sequelize = db.sequelize;

class User extends Model {
  async getUserRoles() {
    return await UserRole.findAll({
      where: { userId: this.id },
      include: {
        model: Role,
        include: { model: Permission },
      },
    });
  }

  async isAdmin() {
    const userRoles = await this.getUserRoles();
    return userRoles.some((userRole) => userRole.Role.name === 'Admin');
  }
}

User.init(
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    name: {
      allowNull: false,
      type: DataTypes.STRING(60),
    },
    email: {
      allowNull: false,
      unique: true,
      type: DataTypes.STRING,
    },
    password: {
      allowNull: false,
      type: DataTypes.STRING,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: new Date(),
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: new Date(),
    },
  },
  {
    sequelize,
    timestamps: true,
  },
);

User.associate = (models) => {
  User.hasMany(models.Article, {
    foreignKey: 'authorId',
  });
  User.belongsToMany(models.Role, {
    through: 'UserRoles',
    onDelete: 'CASCADE',
  });
  User.hasMany(models.Image, {
    foreignKey: 'imageableId',
    constraints: false,
    scope: {
      imageableType: 'USER',
    },
  });
};

// Hash the password before saving
User.beforeCreate((user) => {
  const hashedPassword = bcrypt.hashSync(user.password, 10);
  user.setDataValue('password', hashedPassword);
  // Generate JWT token
  const token = jwt.sign(
    { user: { id: user.id, email: user.email } },
    process.env.JWT_SECRET,
    { expiresIn: '24h' },
  );
  user.setDataValue('token', token);
});

// Set password to null after saving
User.afterCreate((user) => {
  user.setDataValue('password', null);
});

//Set password to null after updating
User.afterUpdate((user) => {
  user.setDataValue('password', null);
});

export default User;
