import { DataTypes, Model } from 'sequelize';
import db from '../config/databaseConnection.js';

const sequelize = db.sequelize;

class Comment extends Model {
  static APPROVED = 'Approved';
  static PENDING = 'Pending';
  static REJECTED = 'Rejected';
  static TRASHED = 'Trashed';
}

Comment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Approved', 'Pending', 'Rejected', 'Trashed'),
      allowNull: false,
    },
    content: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      validate: {
        len: [45, 1000], // Validates length between 60 and 1000 characters
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    articleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    deletedAt: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    timestamps: true, // Enable timestamps
    paranoid: true,
  },
);

Comment.associate = (models) => {
  Comment.belongsTo(models.User);
  Comment.belongsTo(models.Article);
};

export default Comment;
