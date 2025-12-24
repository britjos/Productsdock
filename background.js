// Background service worker for ProductsDock
// Manifest V3 compatible

// Initialize storage and alarms on install
chrome.runtime.onInstalled.addListener(async () => {
  try {
    // Initialize storage
    const result = await chrome.storage.local.get(['products']);
    if (!result.products) {
      await chrome.storage.local.set({ products: [] });
    }
    
    // Set up alarm for periodic price checks (every 6 hours)
    if (chrome.alarms) {
      chrome.alarms.create('priceCheck', { 
        delayInMinutes: 1,
        periodInMinutes: 360 
      });
    }
    
    console.log('ProductsDock installed successfully!');
  } catch (error) {
    console.error('Installation error:', error);
  }
});

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'priceCheck') {
    checkPrices().then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'getProducts') {
    chrome.storage.local.get(['products']).then((result) => {
      sendResponse({ products: result.products || [] });
    }).catch((error) => {
      sendResponse({ products: [], error: error.message });
    });
    return true;
  }
  
  return false;
});

// Check prices function
async function checkPrices() {
  try {
    const result = await chrome.storage.local.get(['products']);
    const products = result.products || [];
    
    console.log(`Checking prices for ${products.length} products`);
    
    // In a real implementation, you would fetch current prices here
    // For now, we'll simulate price checking
    for (const product of products) {
      if (product.watching && Math.random() > 0.95) {
        // Simulate 5% chance of price drop notification
        await createNotification(product);
      }
    }
  } catch (error) {
    console.error('Price check error:', error);
  }
}

// Create notification helper
async function createNotification(product) {
  try {
    if (chrome.notifications) {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'ProductsDock Price Alert',
        message: `${product.name} - Price may have changed!`,
        priority: 2,
        requireInteraction: false
      });
    }
  } catch (error) {
    console.error('Notification error:', error);
  }
}

// Handle alarms
if (chrome.alarms) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'priceCheck') {
      checkPrices();
    }
  });
}

// Update badge when products change
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.products) {
    const count = changes.products.newValue?.length || 0;
    const badgeText = count > 0 ? count.toString() : '';
    
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
  }
});

// Keep service worker alive
self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
});

// Handle startup
chrome.runtime.onStartup.addListener(() => {
  console.log('ProductsDock started');
});