// minimal helper functions used by pages (kept small)
async function updateCartCount(){
  try {
    const res = await fetch('/api/cart');
    const cart = await res.json();
    const count = Object.values(cart).reduce((s,i)=> s + i.qty, 0);
    const el = document.getElementById('cart-link');
    if (el) el.innerText = `Cart (${count})`;
  } catch(e){}
}
updateCartCount();
