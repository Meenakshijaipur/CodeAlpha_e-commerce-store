const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'),
  logging: false
});

// import models
const User = require('./User')(sequelize);
const Product = require('./Product')(sequelize);
const Order = require('./Order')(sequelize);
// import User from './User.js';
// import Product from './Product.js';
// import Order from './Order.js';


// Associations
User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

(async () => {
  await sequelize.sync(); // will create tables if they don't exist
})();

module.exports = {
  sequelize,
  User,
  Product,
  Order
};
