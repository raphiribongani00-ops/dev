// --- STATE ---
let cart = []; 
let allProducts = []; 
const DELIVERY_FEE = 35;
const MINIMUM_ORDER = 100;
let currentUser = null;

// --- DOM ELEMENTS ---
const productGrid = document.getElementById('product-grid');
const cartCount = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const closeCartBtn = document.getElementById('close-cart');
const cartNavBtn = document.getElementById('cart-nav');
const cartItemsContainer = document.getElementById('cart-items-container');
const subtotalEl = document.getElementById('cart-subtotal');
const totalEl = document.getElementById('cart-total');
const minimumWarning = document.getElementById('minimum-warning');
const minimumDiffEl = document.getElementById('minimum-diff');
const checkoutBtn = document.getElementById('checkout-btn');

// Checkout Modal Elements
const checkoutModal = document.getElementById('checkout-modal');
const closeCheckoutBtn = document.getElementById('close-checkout');
const placeOrderBtn = document.getElementById('place-order-btn');
const checkoutItems = document.getElementById('checkout-items');
const checkoutSubtotal = document.getElementById('checkout-subtotal');
const checkoutTotal = document.getElementById('checkout-total');
const addressSearchInput = document.getElementById('address-search');

// Navigation & Views
const homeView = document.getElementById('home-view');
const profileView = document.getElementById('profile-view');
const navHome = document.getElementById('nav-home');
const navProfile = document.getElementById('nav-profile');

// Auth & Profile Elements
const signupModal = document.getElementById('signup-modal');
const googleLoginBtn = document.getElementById('google-login-btn');
const userNameDisplay = document.getElementById('user-name-display');
const profilePhone = document.getElementById('profile-phone');
const saveProfileBtn = document.getElementById('save-profile-btn');
const toastContainer = document.getElementById('toast-container');

// --- TOAST NOTIFICATION ---
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-in forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// --- NAVIGATION LOGIC ---
navHome.addEventListener('click', (e) => {
  e.preventDefault();
  homeView.style.display = 'block';
  profileView.style.display = 'none';
  navHome.classList.add('active');
  navProfile.classList.remove('active');
});

navProfile.addEventListener('click', (e) => {
  e.preventDefault();
  homeView.style.display = 'none';
  profileView.style.display = 'block';
  navProfile.classList.add('active');
  navHome.classList.remove('active');
  if (currentUser) {
    userNameDisplay.value = currentUser.name || "";
    profilePhone.value = currentUser.phone || "";
  }
});

// --- USER LOGIC ---
function checkUser() {
  const savedUser = localStorage.getItem('happeeUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
  } else {
    signupModal.classList.add('open');
  }
}

if (googleLoginBtn) {
  googleLoginBtn.addEventListener('click', async () => {
    try {
      if (!window.firebaseAuth) return;
      const result = await window.firebaseSignIn(window.firebaseAuth, window.firebaseProvider);
      const user = result.user;
      currentUser = { name: user.displayName, email: user.email, photo: user.photoURL, phone: "" };
      localStorage.setItem('happeeUser', JSON.stringify(currentUser));
      signupModal.classList.remove('open');
      showToast(`Welcome, ${currentUser.name.split(' ')[0]}!`);
    } catch (error) {
      console.error("Google login failed:", error);
    }
  });
}

if (saveProfileBtn) {
  saveProfileBtn.addEventListener('click', () => {
    if (!currentUser) return;
    currentUser.phone = profilePhone.value.trim();
    localStorage.setItem('happeeUser', JSON.stringify(currentUser));
    showToast("Profile updated successfully!");
  });
}

// --- FETCH & RENDER PRODUCTS ---
async function loadProducts() {
  try {
    const response = await fetch('http://localhost:4000/api/products');
    allProducts = await response.json();
    productGrid.innerHTML = '';
    allProducts.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.id = `product-${product._id}`; 
      card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="product-name">${product.name}</div>
        <div class="product-price">R${product.price.toFixed(2)}</div>
        <div id="button-container-${product._id}"></div>
      `;
      productGrid.appendChild(card);
      updateProductCardUI(product);
    });
  } catch (error) {
    console.error("Failed to load products:", error);
    productGrid.innerHTML = '<p>Error loading products.</p>';
  }
}

function updateProductCardUI(product) {
  const container = document.getElementById(`button-container-${product._id}`);
  if (!container) return;
  const cartItem = cart.find(item => item.id === product._id);
  if (!cartItem || cartItem.quantity === 0) {
    container.innerHTML = `<button class="add-btn" onclick="addToCart('${product._id}')">Add to Cart</button>`;
  } else {
    container.innerHTML = `
      <div class="stepper">
        <button class="stepper-btn" onclick="updateQuantity('${product._id}', -1)">-</button>
        <span class="stepper-qty">${cartItem.quantity}</span>
        <button class="stepper-btn" onclick="updateQuantity('${product._id}', 1)">+</button>
      </div>
    `;
  }
}

// --- CART LOGIC ---
window.addToCart = function(id) {
  const product = allProducts.find(p => p._id === id);
  if (!product) return;
  const existingItem = cart.find(item => item.id === id);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ id, name: product.name, price: product.price, image: product.image, quantity: 1 });
  }
  updateCartUI();
  updateProductCardUI(product);
}

window.updateQuantity = function(id, change) {
  const item = cart.find(item => item.id === id);
  if (!item) return;
  item.quantity += change;
  if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
  updateCartUI();
  const product = allProducts.find(p => p._id === id);
  if (product) updateProductCardUI(product);
}

function updateCartUI() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;
  cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
  localStorage.setItem('happeeCart', JSON.stringify(cart));
  cartItemsContainer.innerHTML = '';
  let subtotal = 0;

  cart.forEach(item => {
    subtotal += item.price * item.quantity;
    const itemEl = document.createElement('div');
    itemEl.className = 'cart-item';
    itemEl.innerHTML = `
      <div class="cart-item-left">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-info">
          <span class="cart-item-name">${item.name}</span>
          <span class="cart-item-price">R${item.price.toFixed(2)}</span>
        </div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
        <span>${item.quantity}</span>
        <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
      </div>
    `;
    cartItemsContainer.appendChild(itemEl);
  });

  const total = subtotal > 0 ? subtotal + DELIVERY_FEE : 0;
  subtotalEl.textContent = `R${subtotal.toFixed(2)}`;
  totalEl.textContent = `R${total.toFixed(2)}`;

  if (subtotal > 0 && subtotal < MINIMUM_ORDER) {
    minimumWarning.classList.add('visible');
    minimumDiffEl.textContent = (MINIMUM_ORDER - subtotal).toFixed(2);
    checkoutBtn.disabled = true;
    checkoutBtn.style.opacity = '0.5';
  } else {
    minimumWarning.classList.remove('visible');
    checkoutBtn.disabled = cart.length === 0;
    checkoutBtn.style.opacity = cart.length === 0 ? '0.5' : '1';
  }
}

// --- OPEN / CLOSE CART ---
cartNavBtn.addEventListener('click', (e) => { e.preventDefault(); cartModal.classList.add('open'); });
closeCartBtn.addEventListener('click', () => { cartModal.classList.remove('open'); });

// --- CHECKOUT LOGIC ---
checkoutBtn.addEventListener('click', () => {
  if (!currentUser) {
    cartModal.classList.remove('open');
    signupModal.classList.add('open');
    return;
  }

  cartModal.classList.remove('open');
  checkoutModal.classList.add('open');

  // Populate Order Summary
  checkoutItems.innerHTML = '';
  let subtotal = 0;
  cart.forEach(item => {
    subtotal += item.price * item.quantity;
    const itemRow = document.createElement('div');
    itemRow.style.display = 'flex';
    itemRow.style.justifyContent = 'space-between';
    itemRow.style.fontSize = '14px';
    itemRow.innerHTML = `<span>${item.quantity}x ${item.name}</span><span>R${(item.price * item.quantity).toFixed(2)}</span>`;
    checkoutItems.appendChild(itemRow);
  });

  checkoutSubtotal.textContent = `R${subtotal.toFixed(2)}`;
  checkoutTotal.textContent = `R${(subtotal + DELIVERY_FEE).toFixed(2)}`;

  // Pre-fill address if they already have one saved
  if (currentUser.address) {
    addressSearchInput.value = currentUser.address;
  }
});

closeCheckoutBtn.addEventListener('click', () => { checkoutModal.classList.remove('open'); });

// --- PLACE ORDER LOGIC ---
placeOrderBtn.addEventListener('click', async () => {
  const manualAddress = addressSearchInput.value.trim();
  
  if (!manualAddress) {
    showToast("Please enter a delivery address.");
    return;
  }

  // Save address to user profile locally
  currentUser.address = manualAddress;
  localStorage.setItem('happeeUser', JSON.stringify(currentUser));

  // Prepare the order object
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const orderData = {
    customer: currentUser,
    items: cart,
    subtotal: subtotal,
    deliveryFee: DELIVERY_FEE,
    total: subtotal + DELIVERY_FEE,
    deliveryAddress: manualAddress
  };

  try {
    placeOrderBtn.textContent = "Placing Order...";
    placeOrderBtn.disabled = true;

    const response = await fetch('http://localhost:4000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) throw new Error("Failed to save order");

    alert(`Order Placed Successfully!\n\nThank you, ${currentUser.name}.\nDelivering to: ${manualAddress}`);
    
    cart = [];
    updateCartUI();
    checkoutModal.classList.remove('open');

  } catch (error) {
    console.error("Order error:", error);
    showToast("Failed to place order. Please try again.");
  } finally {
    placeOrderBtn.textContent = "Place Order";
    placeOrderBtn.disabled = false;
  }
});

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
  checkUser();
  loadProducts();
  
  const savedCart = localStorage.getItem('happeeCart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
    updateCartUI();
  }
});