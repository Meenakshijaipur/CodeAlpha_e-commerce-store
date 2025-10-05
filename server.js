const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const flash = require('connect-flash');

const { User, Product, Order, sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

// middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'views')));

app.use(session({
  secret: 'simple-ecom-secret-123',
  resave: false,
  saveUninitialized: false
}));
app.use(flash());

// make session user available in templates via simple endpoint
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// Simple JSON endpoints for frontend to call

// Get all products
app.get('/api/products', async (req, res) => {
  const products = await Product.findAll({ order: [['id','ASC']] });
  res.json(products);
});

// Get product by id
app.get('/api/products/:id', async (req, res) => {
  const p = await Product.findByPk(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

// Register
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if(!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  const existing = await User.findOne({ where: { email }});
  if (existing) return res.status(400).json({ error: 'Email already registered' });
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash: hash });
  req.session.user = { id: user.id, name: user.name, email: user.email };
  res.json({ success: true });
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email }});
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
  req.session.user = { id: user.id, name: user.name, email: user.email };
  res.json({ success: true });
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(()=>{ res.json({ success: true }); });
});

// Cart stored in session: /api/cart
app.get('/api/cart', (req,res) => {
  req.session.cart = req.session.cart || {};
  res.json(req.session.cart);
});

app.post('/api/cart/add', async (req,res) => {
  const { productId, qty } = req.body;
  const product = await Product.findByPk(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  req.session.cart = req.session.cart || {};
  const existing = req.session.cart[productId];
  req.session.cart[productId] = {
    productId: product.id,
    title: product.title,
    price: product.price,
    qty: existing ? existing.qty + (qty || 1) : (qty || 1)
  };
  res.json({ success: true, cart: req.session.cart });
});

app.post('/api/cart/update', (req,res) => {
  const { productId, qty } = req.body;
  req.session.cart = req.session.cart || {};
  if (qty <= 0) {
    delete req.session.cart[productId];
  } else {
    if (req.session.cart[productId]) {
      req.session.cart[productId].qty = qty;
    }
  }
  res.json({ success: true, cart: req.session.cart });
});

app.post('/api/cart/clear', (req,res) => {
  req.session.cart = {};
  res.json({ success: true });
});

// Place order
app.post('/api/order', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Login required' });
  const userId = req.session.user.id;
  const cart = req.session.cart || {};
  const items = Object.values(cart);
  if (items.length === 0) return res.status(400).json({ error: 'Cart empty' });
  const total = items.reduce((s,i)=> s + (i.price * i.qty), 0);
  const order = await Order.create({
    userId,
    itemsJson: JSON.stringify(items),
    total
  });
  // clear cart
  req.session.cart = {};
  res.json({ success: true, orderId: order.id });
});

// Simple route to fetch user's orders
app.get('/api/my-orders', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Login required' });
  const orders = await Order.findAll({ where: { userId: req.session.user.id }, order: [['id','DESC']]});
  res.json(orders);
});

// Serve HTML pages (static)
app.get('/', (req,res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/product/:id', (req,res) => res.sendFile(path.join(__dirname, 'views', 'product.html')));
app.get('/cart', (req,res) => res.sendFile(path.join(__dirname, 'views', 'cart.html')));
app.get('/login', (req,res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/register', (req,res) => res.sendFile(path.join(__dirname, 'views', 'register.html')));
app.get('/order-success', (req,res) => res.sendFile(path.join(__dirname, 'views', 'order_success.html')));

// Start server after ensuring DB sync
(async () => {
  try {
    await sequelize.sync();
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start', err);
  }
})();
