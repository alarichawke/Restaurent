
let cart = JSON.parse(localStorage.getItem('cart')) || [];

const cartItemsContainer = document.querySelector('.cart-items');
const subtotalEl = document.getElementById('subtotal');
const taxEl = document.getElementById('tax');
const totalEl = document.getElementById('total');


function renderCart() {
  cartItemsContainer.innerHTML = '';
  let subtotal = 0;

  cart.forEach((item, index) => {
    subtotal += item.price * item.quantity;

    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.innerHTML = `
      <div class="cart-item-image">
        <img src="${item.img}" alt="${item.name}">
      </div>
      <div class="cart-item-details">
        <h3>${item.name}</h3>
        <p>Price: $${item.price.toFixed(2)}</p>
        <label>
          Count: <input type="number" min="1" value="${item.quantity}" data-index="${index}">
        </label>
      </div>
      <button class="remove-btn" data-index="${index}"><i class="fas fa-trash"></i></button>
    `;

    cartItemsContainer.appendChild(cartItem);
  });

  const tax = subtotal * 0.10;
  const total = subtotal + tax;

  subtotalEl.textContent = subtotal.toFixed(2);
  taxEl.textContent = tax.toFixed(2);
  totalEl.textContent = total.toFixed(2);

  localStorage.setItem('cart', JSON.stringify(cart));
}

// Listen for quantity changes
cartItemsContainer.addEventListener('input', e => {
  if (e.target.tagName === 'INPUT') {
    const index = e.target.dataset.index;
    const value = parseInt(e.target.value);
    if (value >= 1) {
      cart[index].quantity = value;
      renderCart();
    }
  }
});

cartItemsContainer.addEventListener('click', e => {
  if (e.target.closest('.remove-btn')) {
    const index = e.target.closest('.remove-btn').dataset.index;
    cart.splice(index, 1);
    renderCart();
  }
});

document.getElementById('checkout-btn').addEventListener('click', () => {
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  alert('Proceeding to checkout...');

});


renderCart();
