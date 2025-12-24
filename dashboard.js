// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view;
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById(`${view}View`).classList.add('active');
    
    loadViewData(view);
  });
});

// Load data for each view
async function loadViewData(view) {
  const products = await getProducts();
  
  switch(view) {
    case 'overview':
      loadOverview(products);
      break;
    case 'products':
      loadProducts(products);
      break;
    case 'alerts':
      loadAlerts(products);
      break;
    case 'analytics':
      loadAnalytics(products);
      break;
  }
}

// Get products from storage
async function getProducts() {
  const result = await chrome.storage.local.get(['products']);
  return result.products || [];
}

// Load Overview
async function loadOverview(products) {
  // Update stats
  document.getElementById('statTotal').textContent = products.length;
  document.getElementById('statWatching').textContent = products.filter(p => p.watching).length;
  
  const totalValue = products.reduce((sum, p) => {
    const price = typeof p.price === 'number' ? p.price : 0;
    return sum + price;
  }, 0);
  document.getElementById('statValue').textContent = `$${totalValue.toFixed(2)}`;
  
  const avgPrice = products.length > 0 ? totalValue / products.length : 0;
  document.getElementById('statAvg').textContent = `$${avgPrice.toFixed(2)}`;
  
  // Recent Activity
  const activityList = document.getElementById('recentActivity');
  const recentProducts = products.slice(-5).reverse();
  
  if (recentProducts.length === 0) {
    activityList.innerHTML = '<div class="empty-state"><p>No activity yet</p></div>';
  } else {
    activityList.innerHTML = recentProducts.map(p => {
      const date = new Date(p.dateAdded);
      const timeAgo = getTimeAgo(date);
      
      return `
        <div class="activity-item">
          <div class="activity-icon">${p.name.charAt(0).toUpperCase()}</div>
          <div class="activity-info">
            <div class="activity-title">${p.name}</div>
            <div class="activity-time">${timeAgo}</div>
          </div>
        </div>
      `;
    }).join('');
  }
  
  // Price Chart (simple mock)
  createPriceChart(products);
}

// Load Products View
function loadProducts(products) {
  const grid = document.getElementById('productsGrid');
  
  if (products.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
        </svg>
        <p>No products tracked yet</p>
        <p style="font-size: 14px; margin-top: 8px;">Start tracking products from the extension popup</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = products.map(p => {
    const date = new Date(p.dateAdded);
    const formattedDate = date.toLocaleDateString();
    const price = typeof p.price === 'number' ? `$${p.price.toFixed(2)}` : p.price;
    
    return `
      <div class="product-card-dash">
        <img src="${p.image}" alt="${p.name}" class="product-image-dash" onerror="this.src='https://via.placeholder.com/400x200'">
        <div class="product-content">
          <div class="product-name-dash">${p.name}</div>
          <div class="product-price-dash">${price}</div>
          <div class="product-meta">
            <span>Added: ${formattedDate}</span>
            <span>${p.watching ? '👁️ Watching' : ''}</span>
          </div>
          <div class="product-actions-dash">
            <button class="btn-dash btn-view" onclick="window.open('${p.url}', '_blank')">View</button>
            <button class="btn-dash btn-delete-dash" onclick="deleteProductDash('${p.id}')">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Setup filters
  setupFilters(products);
}

// Setup filter and sort
function setupFilters(products) {
  const filterInput = document.getElementById('filterInput');
  const sortSelect = document.getElementById('sortSelect');
  
  const applyFilters = () => {
    let filtered = [...products];
    
    // Filter
    const filterTerm = filterInput.value.toLowerCase();
    if (filterTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(filterTerm)
      );
    }
    
    // Sort
    const sortBy = sortSelect.value;
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'price') {
        const priceA = typeof a.price === 'number' ? a.price : 0;
        const priceB = typeof b.price === 'number' ? b.price : 0;
        return priceB - priceA;
      } else {
        return new Date(b.dateAdded) - new Date(a.dateAdded);
      }
    });
    
    loadProducts(filtered);
  };
  
  filterInput.addEventListener('input', applyFilters);
  sortSelect.addEventListener('change', applyFilters);
}

// Load Alerts
function loadAlerts(products) {
  const alertsList = document.getElementById('alertsList');
  const watching = products.filter(p => p.watching);
  
  if (watching.length === 0) {
    alertsList.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        </svg>
        <p>No price alerts active</p>
      </div>
    `;
    return;
  }
  
  alertsList.innerHTML = watching.map(p => {
    const price = typeof p.price === 'number' ? `$${p.price.toFixed(2)}` : p.price;
    
    return `
      <div class="alert-card">
        <div class="alert-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          </svg>
        </div>
        <div class="alert-content">
          <div class="alert-title">${p.name}</div>
          <div class="alert-description">Watching for price changes • Current: ${price}</div>
        </div>
      </div>
    `;
  }).join('');
}

// Load Analytics
function loadAnalytics(products) {
  if (products.length === 0) {
    document.querySelector('#analyticsView .analytics-grid').innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="20" x2="12" y2="10"></line>
          <line x1="18" y1="20" x2="18" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="16"></line>
        </svg>
        <p>Not enough data for analytics</p>
      </div>
    `;
    return;
  }
  
  createSpendingChart(products);
  createCategoryChart(products);
  showTopProducts(products);
}

// Create Price Chart
function createPriceChart(products) {
  const canvas = document.getElementById('priceChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Simple line chart
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = 250;
  
  ctx.clearRect(0, 0, width, height);
  
  if (products.length === 0) {
    ctx.fillStyle = '#718096';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No data to display', width / 2, height / 2);
    return;
  }
  
  // Draw gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(102, 126, 234, 0.1)');
  gradient.addColorStop(1, 'rgba(102, 126, 234, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Draw line
  ctx.strokeStyle = '#667eea';
  ctx.lineWidth = 3;
  ctx.beginPath();
  
  const points = Math.min(products.length, 10);
  const spacing = width / points;
  
  products.slice(-points).forEach((p, i) => {
    const x = i * spacing;
    const y = height - (Math.random() * height * 0.6 + height * 0.2);
    
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  
  ctx.stroke();
}

// Create Spending Chart
function createSpendingChart(products) {
  const canvas = document.getElementById('spendingChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = 250;
  
  ctx.clearRect(0, 0, width, height);
  
  // Simple bar chart
  const barWidth = width / products.length;
  const maxPrice = Math.max(...products.map(p => typeof p.price === 'number' ? p.price : 0));
  
  products.forEach((p, i) => {
    const price = typeof p.price === 'number' ? p.price : 0;
    const barHeight = (price / maxPrice) * height * 0.8;
    const x = i * barWidth;
    const y = height - barHeight;
    
    const gradient = ctx.createLinearGradient(0, y, 0, height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth - 2, barHeight);
  });
}

// Create Category Chart (Pie chart placeholder)
function createCategoryChart(products) {
  const canvas = document.getElementById('categoryChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = 250;
  
  ctx.clearRect(0, 0, width, height);
  
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 20;
  
  const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'];
  const slices = Math.min(products.length, 5);
  const angleStep = (Math.PI * 2) / slices;
  
  let currentAngle = -Math.PI / 2;
  
  for (let i = 0; i < slices; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angleStep);
    ctx.closePath();
    ctx.fill();
    
    currentAngle += angleStep;
  }
}

// Show Top Products
function showTopProducts(products) {
  const topList = document.getElementById('topProducts');
  
  const sorted = [...products].sort((a, b) => {
    const priceA = typeof a.price === 'number' ? a.price : 0;
    const priceB = typeof b.price === 'number' ? b.price : 0;
    return priceB - priceA;
  }).slice(0, 5);
  
  topList.innerHTML = sorted.map((p, i) => {
    const price = typeof p.price === 'number' ? `$${p.price.toFixed(2)}` : p.price;
    
    return `
      <div class="top-item">
        <div class="top-rank">${i + 1}</div>
        <div class="top-info">
          <div class="top-name">${p.name}</div>
        </div>
        <div class="top-value">${price}</div>
      </div>
    `;
  }).join('');
}

// Delete Product
window.deleteProductDash = async function(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  
  const result = await chrome.storage.local.get(['products']);
  const products = result.products || [];
  const filtered = products.filter(p => p.id !== id);
  
  await chrome.storage.local.set({ products: filtered });
  loadViewData('products');
};

// Export Data
document.getElementById('exportBtn').addEventListener('click', async () => {
  const products = await getProducts();
  const dataStr = JSON.stringify(products, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `productsdock-export-${Date.now()}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
});

// Refresh Dashboard
document.getElementById('refreshDashboard').addEventListener('click', () => {
  loadViewData('overview');
});

// Helper: Time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Initialize
loadViewData('overview');