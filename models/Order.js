const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    itemsJson: { type: DataTypes.TEXT, allowNull: false }, // JSON of items [{productId, title, qty, price}]
    total: { type: DataTypes.FLOAT, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'placed' }
  }, {
    tableName: 'orders'
  });

  return Order;
};
