// Tab Switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById(`${tab}Tab`).classList.add('active');
    
    if (tab === 'saved') {
      loadSavedProducts();
    }
  });
});

// Dashboard Button
document.getElementById('dashboardBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
});

// Refresh Button
document.getElementById('refreshBtn').addEventListener('click', () => {
  loadSavedProducts();
  showNotification('Refreshed!');
});

// Detect Product Button
document.getElementById('detectBtn').addEventListener('click', async () => {
  const btn = document.getElementById('detectBtn');
  btn.textContent = 'Detecting...';
  btn.disabled = true;
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, { action: 'detectProduct' }, (response) => {
      if (chrome.runtime.lastError) {
        showNotification('Could not detect product on this page', 'error');
        btn.textContent = 'Detect Product';
        btn.disabled = false;
        return;
      }
      
      if (response && response.product) {
        saveProduct(response.product);
        showNotification('Product detected and saved!');
      } else {
        showNotification('No product found on this page', 'error');
      }
      
      btn.textContent = 'Detect Product';
      btn.disabled = false;
    });
  } catch (error) {
    console.error(error);
    btn.textContent = 'Detect Product';
    btn.disabled = false;
  }
});

// Manual Add Product Form
document.getElementById('addProductForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const product = {
    id: Date.now().toString(),
    name: document.getElementById('productName').value,
    url: document.getElementById('productUrl').value,
    price: document.getElementById('productPrice').value || 'N/A',
    image: document.getElementById('productImage').value || 'https://via.placeholder.com/150',
    dateAdded: new Date().toISOString(),
    watching: true
  };
  
  saveProduct(product);
  document.getElementById('addProductForm').reset();
  showNotification('Product added successfully!');
});

// Search Products
document.getElementById('searchBtn').addEventListener('click', async () => {
  const query = document.getElementById('searchInput').value.trim();
  
  if (!query) {
    showNotification('Please enter a search term', 'error');
    return;
  }
  
  const resultsDiv = document.getElementById('searchResults');
  resultsDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Searching...</p></div>';
  
  try {
    // Using Amazon Product API (free alternative with RapidAPI)
    // For demo purposes, we'll simulate results
    const products = await searchProducts(query);
    displaySearchResults(products);
  } catch (error) {
    resultsDiv.innerHTML = '<div class="empty-state"><p>Search failed. Please try again.</p></div>';
  }
});

// Save Product
async function saveProduct(product) {
  const result = await chrome.storage.local.get(['products']);
  const products = result.products || [];
  
  // Check if product already exists
  const exists = products.find(p => p.url === product.url);
  if (exists) {
    showNotification('Product already saved!', 'error');
    return;
  }
  
  products.push(product);
  await chrome.storage.local.set({ products });
  
  loadSavedProducts();
}

// Load Saved Products
async function loadSavedProducts() {
  const result = await chrome.storage.local.get(['products']);
  const products = result.products || [];
  
  const totalEl = document.getElementById('totalProducts');
  const watchingEl = document.getElementById('watchingProducts');
  const listEl = document.getElementById('savedProductsList');
  
  totalEl.textContent = products.length;
  watchingEl.textContent = products.filter(p => p.watching).length;
  
  if (products.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>
        <p>No products saved yet</p>
        <p style="font-size: 12px; margin-top: 8px;">Start tracking products to see them here</p>
      </div>
    `;
    return;
  }
  
  listEl.innerHTML = products.map(product => `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/150'">
      <div class="product-info">
        <div class="product-name">${product.name}</div>
        <div class="product-price">${typeof product.price === 'number' ? '$' + product.price.toFixed(2) : product.price}</div>
        <div class="product-actions">
          <button class="btn-small btn-visit" onclick="visitProduct('${product.url}')">Visit</button>
          <button class="btn-small btn-delete" onclick="deleteProduct('${product.id}')">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Delete Product
window.deleteProduct = async function(id) {
  const result = await chrome.storage.local.get(['products']);
  const products = result.products || [];
  
  const filtered = products.filter(p => p.id !== id);
  await chrome.storage.local.set({ products: filtered });
  
  loadSavedProducts();
  showNotification('Product removed');
};

// Visit Product
window.visitProduct = function(url) {
  chrome.tabs.create({ url });
};

// Search Products (Mock API for demo)
async function searchProducts(query) {
  // Simulated search results
  // In production, use real API like Amazon Product API, Best Buy API, or eBay API
  return [
    {
      id: Date.now() + '1',
      name: `${query} - Premium Edition`,
      price: 99.99,
      image: 'https://via.placeholder.com/150',
      url: `https://www.amazon.com/s?k=${encodeURIComponent(query)}`,
      watching: false
    },
    {
      id: Date.now() + '2',
      name: `${query} - Standard Version`,
      price: 79.99,
      image: 'https://via.placeholder.com/150',
      url: `https://www.amazon.com/s?k=${encodeURIComponent(query)}`,
      watching: false
    },
    {
      id: Date.now() + '3',
      name: `${query} - Budget Option`,
      price: 49.99,
      image: 'https://via.placeholder.com/150',
      url: `https://www.amazon.com/s?k=${encodeURIComponent(query)}`,
      watching: false
    }
  ];
}

// Display Search Results
function displaySearchResults(products) {
  const resultsDiv = document.getElementById('searchResults');
  
  if (products.length === 0) {
    resultsDiv.innerHTML = '<div class="empty-state"><p>No products found</p></div>';
    return;
  }
  
  resultsDiv.innerHTML = products.map(product => `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}" class="product-image">
      <div class="product-info">
        <div class="product-name">${product.name}</div>
        <div class="product-price">$${product.price.toFixed(2)}</div>
        <div class="product-actions">
          <button class="btn-small btn-visit" onclick="visitProduct('${product.url}')">Visit</button>
          <button class="btn-small btn-success" onclick='saveSearchProduct(${JSON.stringify(product)})'>Save</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Save Search Product
window.saveSearchProduct = function(product) {
  product.dateAdded = new Date().toISOString();
  product.watching = true;
  saveProduct(product);
};

// Show Notification
function showNotification(message, type = 'success') {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 70px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'error' ? '#dc3545' : '#28a745'};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    animation: slideDown 0.3s ease;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideUp 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// Initialize
loadSavedProducts();