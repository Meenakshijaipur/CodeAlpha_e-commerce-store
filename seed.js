const { Product, sequelize } = require('./models');

async function seed(){
  await sequelize.sync();
  const count = await Product.count();
  if (count > 0) {
    console.log('Products already seeded');
    process.exit(0);
  }

  const products = [
    {
      title: "Classic White T-Shirt",
      description: "Comfortable cotton t-shirt. Available in all sizes.",
      price: 249.00,
      image: "https://picsum.photos/seed/tshirt/600/400"
    },
    {
      title: "Blue Denim Jeans",
      description: "Slim fit denim jeans with stretch fabric.",
      price: 1299.00,
      image: "https://picsum.photos/seed/jeans/600/400"
    },
    {
      title: "Wireless Headphones",
      description: "Over-ear Bluetooth headphones with 20h battery.",
      price: 2999.00,
      image: "https://picsum.photos/seed/headphones/600/400"
    },
    {
      title: "Running Shoes",
      description: "Lightweight running shoes for everyday workouts.",
      price: 2199.00,
      image: "https://picsum.photos/seed/shoes/600/400"
    }
  ];

  await Product.bulkCreate(products);
  console.log('Seeded products');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
