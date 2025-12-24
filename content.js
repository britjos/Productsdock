// Content script for product detection
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'detectProduct') {
    const product = detectProductOnPage();
    sendResponse({ product });
  }
  return true;
});

function detectProductOnPage() {
  const url = window.location.href;
  
  // Detect Amazon products
  if (url.includes('amazon.com')) {
    return detectAmazonProduct();
  }
  
  // Detect eBay products
  if (url.includes('ebay.com')) {
    return detectEbayProduct();
  }
  
  // Generic detection
  return detectGenericProduct();
}

function detectAmazonProduct() {
  try {
    const titleEl = document.querySelector('#productTitle, h1.product-title');
    const priceEl = document.querySelector('.a-price .a-offscreen, #priceblock_ourprice, .a-price-whole');
    const imageEl = document.querySelector('#landingImage, #imgTagWrapperId img');
    
    if (!titleEl) return null;
    
    const name = titleEl.textContent.trim();
    let price = 'N/A';
    
    if (priceEl) {
      const priceText = priceEl.textContent.trim();
      const priceMatch = priceText.match(/[\d,.]+/);
      if (priceMatch) {
        price = parseFloat(priceMatch[0].replace(',', ''));
      }
    }
    
    const image = imageEl ? imageEl.src : 'https://via.placeholder.com/150';
    
    return {
      id: Date.now().toString(),
      name,
      price,
      url: window.location.href,
      image,
      dateAdded: new Date().toISOString(),
      watching: true,
      source: 'Amazon'
    };
  } catch (error) {
    console.error('Amazon detection error:', error);
    return null;
  }
}

function detectEbayProduct() {
  try {
    const titleEl = document.querySelector('.x-item-title__mainTitle, h1.it-ttl');
    const priceEl = document.querySelector('.x-price-primary, #prcIsum');
    const imageEl = document.querySelector('.ux-image-carousel-item img, #icImg');
    
    if (!titleEl) return null;
    
    const name = titleEl.textContent.trim();
    let price = 'N/A';
    
    if (priceEl) {
      const priceText = priceEl.textContent.trim();
      const priceMatch = priceText.match(/[\d,.]+/);
      if (priceMatch) {
        price = parseFloat(priceMatch[0].replace(',', ''));
      }
    }
    
    const image = imageEl ? imageEl.src : 'https://via.placeholder.com/150';
    
    return {
      id: Date.now().toString(),
      name,
      price,
      url: window.location.href,
      image,
      dateAdded: new Date().toISOString(),
      watching: true,
      source: 'eBay'
    };
  } catch (error) {
    console.error('eBay detection error:', error);
    return null;
  }
}

function detectGenericProduct() {
  try {
    // Try to find common product patterns
    const titleSelectors = [
      'h1',
      '[class*="product"][class*="title"]',
      '[class*="product"][class*="name"]',
      '[itemprop="name"]'
    ];
    
    const priceSelectors = [
      '[class*="price"]',
      '[itemprop="price"]',
      '[data-price]',
      '.amount',
      '.cost'
    ];
    
    const imageSelectors = [
      '[class*="product"][class*="image"] img',
      '[itemprop="image"]',
      '.product-img img',
      'img[alt*="product"]'
    ];
    
    let titleEl, priceEl, imageEl;
    
    for (const selector of titleSelectors) {
      titleEl = document.querySelector(selector);
      if (titleEl && titleEl.textContent.trim().length > 0) break;
    }
    
    for (const selector of priceSelectors) {
      priceEl = document.querySelector(selector);
      if (priceEl) break;
    }
    
    for (const selector of imageSelectors) {
      imageEl = document.querySelector(selector);
      if (imageEl && imageEl.src) break;
    }
    
    if (!titleEl) return null;
    
    const name = titleEl.textContent.trim();
    let price = 'N/A';
    
    if (priceEl) {
      const priceText = priceEl.textContent.trim();
      const priceMatch = priceText.match(/[\d,.]+/);
      if (priceMatch) {
        price = parseFloat(priceMatch[0].replace(',', ''));
      }
    }
    
    const image = imageEl ? imageEl.src : 'https://via.placeholder.com/150';
    
    return {
      id: Date.now().toString(),
      name,
      price,
      url: window.location.href,
      image,
      dateAdded: new Date().toISOString(),
      watching: true,
      source: 'Web'
    };
  } catch (error) {
    console.error('Generic detection error:', error);
    return null;
  }
}