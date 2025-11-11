// ==========================================
// MENU PAGE JAVASCRIPT - Chicago Pizza
// ==========================================
// Dependencies: main.js (provides $, $$, debounce utilities)

// Check if main.js utilities are available
if (typeof $ === 'undefined' || typeof $$ === 'undefined') {
    console.error('❌ Main.js utilities not found! Make sure main.js is loaded first.');
}

// Toast Notification System
// ==========================================
const Toast = {
    container: null,
    
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            this.container.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10001;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(this.container);
        }
    },
    
    show(message, type = 'success', duration = 3000) {
        this.init();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            padding: 1rem 1.5rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            gap: 0.75rem;
            align-items: center;
            min-width: 250px;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;
        
        const iconMap = {
            success: '<i class="fas fa-check-circle" style="color: var(--basil-green); font-size: 1.25rem;"></i>',
            error: '<i class="fas fa-exclamation-circle" style="color: var(--tomato-red); font-size: 1.25rem;"></i>',
            info: '<i class="fas fa-info-circle" style="color: var(--primary-orange); font-size: 1.25rem;"></i>'
        };
        
        toast.innerHTML = `
            ${iconMap[type] || iconMap.success}
            <span style="font-size: 0.875rem; font-weight: 500;">${message}</span>
        `;
        
        this.container.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after duration
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

// Cart Manager
// ==========================================
const CartManager = {
    items: [],
    
    init() {
        console.log('🛒 CartManager initializing...');
        this.loadFromStorage();
        console.log('Loaded items from storage:', this.items);
        this.updateUI();
        this.bindEvents();
        console.log('✅ CartManager initialized successfully');
    },
    
    loadFromStorage() {
        const saved = localStorage.getItem('pizzaCart');
        if (saved) {
            try {
                this.items = JSON.parse(saved);
            } catch (e) {
                console.error('Error loading cart:', e);
                this.items = [];
            }
        }
    },
    
    saveToStorage() {
        localStorage.setItem('pizzaCart', JSON.stringify(this.items));
    },
    
    add(item) {
        console.log('Adding to cart:', item);
        
        // Check if item already exists
        const existingIndex = this.items.findIndex(i => {
            if (i.customizations && item.customizations) {
                return i.id === item.id && 
                       JSON.stringify(i.customizations) === JSON.stringify(item.customizations);
            }
            return i.id === item.id;
        });
        
        if (existingIndex > -1) {
            this.items[existingIndex].quantity += 1;
            console.log('Updated quantity:', this.items[existingIndex]);
        } else {
            this.items.push({
                ...item,
                quantity: 1,
                addedAt: Date.now()
            });
            console.log('Added new item:', this.items[this.items.length - 1]);
        }
        
        this.saveToStorage();
        this.updateUI();
        Toast.show(`${item.name} added to cart!`, 'success');
        
        // Auto-open cart sidebar after a short delay
        setTimeout(() => {
            this.toggleSidebar();
        }, 500);
        
        // Track event
        this.trackEvent('add_to_cart', item);
    },
    
    remove(index) {
        const item = this.items[index];
        this.items.splice(index, 1);
        this.saveToStorage();
        this.updateUI();
        Toast.show(`${item.name} removed from cart`, 'info');
    },
    
    updateQuantity(index, quantity) {
        if (quantity <= 0) {
            this.remove(index);
            return;
        }
        
        this.items[index].quantity = quantity;
        this.saveToStorage();
        this.updateUI();
    },
    
    clear() {
        this.items = [];
        this.saveToStorage();
        this.updateUI();
    },
    
    getTotal() {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },
    
    getItemCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    },
    
    updateUI() {
        this.updateBadge();
        this.updateSidebar();
    },
    
    updateBadge() {
        const badge = $('#cartBadge');
        if (badge) {
            const count = this.getItemCount();
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    },
    
    updateSidebar() {
        const cartItems = $('#cartItems');
        const emptyCart = $('#emptyCart');
        const cartFooter = $('#cartFooter');
        
        console.log('Updating sidebar. Items:', this.items.length);
        
        if (!cartItems || !emptyCart || !cartFooter) {
            console.error('Cart elements not found');
            return;
        }
        
        if (this.items.length === 0) {
            emptyCart.style.display = 'block';
            cartItems.style.display = 'none';
            cartFooter.style.display = 'none';
        } else {
            emptyCart.style.display = 'none';
            cartItems.style.display = 'flex';
            cartFooter.style.display = 'block';
            
            // Render items
            cartItems.innerHTML = this.items.map((item, index) => {
                const customText = item.customizations ? this.formatCustomizations(item.customizations) : '';
                
                return `
                    <div class="cart-item">
                        <div class="cart-item__image">
                            <img src="${item.image || 'https://via.placeholder.com/80x80/f15a24/fff?text=Pizza'}" 
                                 alt="${item.name}"
                                 onerror="this.src='https://via.placeholder.com/80x80/f15a24/fff?text=Pizza'">
                        </div>
                        <div class="cart-item__details">
                            <div class="cart-item__name">${item.name}</div>
                            ${customText ? `<div class="cart-item__options">${customText}</div>` : ''}
                            <div class="cart-item__price">$${(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                        <div class="cart-item__actions">
                            <div class="quantity-control">
                                <button class="quantity-btn" data-action="decrease" data-index="${index}">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <span class="quantity-value">${item.quantity}</span>
                                <button class="quantity-btn" data-action="increase" data-index="${index}">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <button class="remove-item" data-index="${index}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Update totals
            const subtotal = this.getTotal();
            const deliveryFee = subtotal >= 25 ? 0 : 3.99;
            const total = subtotal + deliveryFee;
            
            const subtotalEl = $('#cartSubtotal');
            const deliveryEl = $('#cartDeliveryFee');
            const totalEl = $('#cartTotal');
            
            if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
            if (deliveryEl) deliveryEl.textContent = deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`;
            if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
            
            // Bind quantity buttons (must be called after innerHTML update)
            this.bindQuantityButtons();
        }
    },
    
    formatCustomizations(custom) {
        const parts = [];
        if (custom.size) parts.push(custom.size);
        if (custom.crust) parts.push(`${custom.crust} crust`);
        if (custom.sauce) parts.push(`${custom.sauce} sauce`);
        if (custom.toppings && custom.toppings.length > 0) {
            parts.push(`+ ${custom.toppings.length} toppings`);
        }
        return parts.join(' • ');
    },
    
    bindQuantityButtons() {
        $$('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const index = parseInt(btn.dataset.index);
                const action = btn.dataset.action;
                const item = this.items[index];
                
                if (action === 'increase') {
                    this.updateQuantity(index, item.quantity + 1);
                } else if (action === 'decrease') {
                    this.updateQuantity(index, item.quantity - 1);
                }
            });
        });
        
        $$('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const index = parseInt(btn.dataset.index);
                this.remove(index);
            });
        });
    },
    
    bindEvents() {
        console.log('🔗 Binding cart events...');
        
        // Cart trigger button (header cart icon)
        const cartTrigger = $('#viewCartBtn');
        if (cartTrigger) {
            cartTrigger.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🛒 Cart trigger clicked');
                this.toggleSidebar();
            });
            console.log('✅ Cart trigger bound');
        } else {
            console.warn('⚠️ Cart trigger button (#viewCartBtn) not found');
        }
        
        // Close button (X button in cart header)
        const closeBtn = $('#closeCartBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('❌ Close button clicked');
                this.closeSidebar();
            });
            console.log('✅ Close button bound');
        } else {
            console.warn('⚠️ Close cart button (#closeCartBtn) not found');
        }
        
        // Overlay (dark background)
        const overlay = $('#cartOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                console.log('🖱️ Overlay clicked');
                this.closeSidebar();
            });
            console.log('✅ Overlay bound');
        } else {
            console.warn('⚠️ Cart overlay (#cartOverlay) not found');
        }
        
        // ESC key listener
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const sidebar = $('#cartSidebar');
                if (sidebar && sidebar.classList.contains('active')) {
                    console.log('⌨️ ESC pressed - closing cart');
                    this.closeSidebar();
                }
            }
        });
        console.log('✅ ESC key listener bound');
        
        console.log('✅ All cart events successfully bound');
    },
    
    toggleSidebar() {
        const sidebar = $('#cartSidebar');
        const overlay = $('#cartOverlay');
        
        console.log('Toggle sidebar called');
        
        if (!sidebar || !overlay) {
            console.error('❌ Cart elements not found!');
            return;
        }
        
        const isOpening = !sidebar.classList.contains('active');
        
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
        
        console.log('Cart is now:', sidebar.classList.contains('active') ? 'OPEN' : 'CLOSED');
        
        // Show helpful message if cart is empty and opening
        if (isOpening && this.items.length === 0) {
            setTimeout(() => {
                Toast.show('Your cart is empty. Browse our delicious pizzas below!', 'info', 3000);
            }, 500);
        }
    },
    
    closeSidebar() {
        const sidebar = $('#cartSidebar');
        const overlay = $('#cartOverlay');
        
        console.log('🚪 Closing cart sidebar...');
        
        if (sidebar && overlay) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            console.log('✅ Cart closed successfully');
        } else {
            console.error('❌ Cannot close - elements not found');
        }
    },
    
    trackEvent(eventName, item) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                'event_category': 'Ecommerce',
                'event_label': item.name,
                'value': item.price
            });
        }
        console.log(`Event: ${eventName}`, item);
    }
};

// Menu Manager
// ==========================================
const MenuManager = {
    allItems: [],
    filteredItems: [],
    currentCategory: 'all',
    currentSort: 'popular',
    searchQuery: '',
    
    init() {
        console.log('📋 MenuManager initializing...');
        this.cacheItems();
        this.bindEvents();
        this.applyFilters();
        console.log('✅ MenuManager initialized');
    },
    
    cacheItems() {
        this.allItems = Array.from($$('.pizza-card')).map(card => ({
            element: card,
            category: card.dataset.category || '',
            price: parseFloat(card.dataset.price) || 0,
            rating: parseFloat(card.dataset.rating) || 0,
            name: card.dataset.name || '',
            keywords: (card.textContent || '').toLowerCase()
        }));
        console.log(`Cached ${this.allItems.length} menu items`);
    },
    
    bindEvents() {
        // Category tabs
        $$('.category-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.setCategory(tab.dataset.category);
            });
        });
        
        // Search
        const searchInput = $('#menuSearch');
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                this.setSearch(e.target.value);
            }, 300));
        }
        
        // Sort
        const sortSelect = $('#sortMenu');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.setSort(e.target.value);
            });
        }
        
        // Reset search
        const resetBtn = $('#resetSearch');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }
    },
    
    setCategory(category) {
        this.currentCategory = category;
        
        // Update active tab
        $$('.category-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });
        
        this.applyFilters();
    },
    
    setSearch(query) {
        this.searchQuery = query.toLowerCase().trim();
        this.applyFilters();
    },
    
    setSort(sort) {
        this.currentSort = sort;
        this.applyFilters();
    },
    
    resetFilters() {
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.currentSort = 'popular';
        
        // Reset UI
        $$('.category-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === 'all');
        });
        
        const searchInput = $('#menuSearch');
        if (searchInput) searchInput.value = '';
        
        const sortSelect = $('#sortMenu');
        if (sortSelect) sortSelect.value = 'popular';
        
        this.applyFilters();
    },
    
    applyFilters() {
        // Filter by category
        let filtered = this.allItems.filter(item => {
            if (this.currentCategory === 'all') return true;
            return item.category.includes(this.currentCategory);
        });
        
        // Filter by search
        if (this.searchQuery) {
            filtered = filtered.filter(item => 
                item.keywords.includes(this.searchQuery)
            );
        }
        
        // Sort
        filtered.sort((a, b) => {
            switch (this.currentSort) {
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'rating':
                    return b.rating - a.rating;
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'popular':
                default:
                    return b.rating - a.rating;
            }
        });
        
        this.filteredItems = filtered;
        this.renderResults();
    },
    
    renderResults() {
        const grid = $('#menuGrid');
        const emptyState = $('#emptyState');
        
        if (!grid) return;
        
        // Hide all items first
        this.allItems.forEach(item => {
            item.element.style.display = 'none';
        });
        
        if (this.filteredItems.length === 0) {
            // Show empty state
            if (emptyState) emptyState.style.display = 'block';
        } else {
            // Hide empty state
            if (emptyState) emptyState.style.display = 'none';
            
            // Show filtered items
            this.filteredItems.forEach((item, index) => {
                item.element.style.display = 'block';
                item.element.style.order = index;
                
                // Animate in
                item.element.style.opacity = '0';
                item.element.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    item.element.style.transition = 'all 0.3s ease';
                    item.element.style.opacity = '1';
                    item.element.style.transform = 'translateY(0)';
                }, index * 50);
            });
        }
    }
};

// Pizza Builder
// ==========================================
const PizzaBuilder = {
    currentStep: 1,
    totalSteps: 4,
    selections: {
        size: 'medium',
        crust: 'thin',
        sauce: 'marinara',
        toppings: []
    },
    prices: {
        size: 12.99,
        crust: 0,
        sauce: 0,
        toppings: 0
    },
    
    init() {
        console.log('🍕 PizzaBuilder initializing...');
        this.bindEvents();
        this.loadDefaults();
        this.updatePrice();
        console.log('✅ PizzaBuilder initialized');
    },
    
    bindEvents() {
        // Open builder
        const openBtn = $('#openBuilderBtn');
        if (openBtn) {
            openBtn.addEventListener('click', () => this.open());
        }
        
        // Close builder
        $$('[data-close-builder]').forEach(btn => {
            btn.addEventListener('click', () => this.close());
        });
        
        // Navigation buttons
        const nextBtn = $('#builderNextBtn');
        const prevBtn = $('#builderPrevBtn');
        const addBtn = $('#builderAddToCartBtn');
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextStep());
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevStep());
        }
        
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addToCart());
        }
        
        // Size selection
        $$('input[name="pizza-size"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.selections.size = e.target.value;
                this.prices.size = parseFloat(e.target.dataset.price);
                this.updatePrice();
            });
        });
        
        // Crust selection
        $$('input[name="pizza-crust"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.selections.crust = e.target.value;
                this.prices.crust = parseFloat(e.target.dataset.price);
                this.updatePrice();
            });
        });
        
        // Sauce selection
        $$('input[name="pizza-sauce"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.selections.sauce = e.target.value;
                this.prices.sauce = parseFloat(e.target.dataset.price);
                this.updatePrice();
            });
        });
        
        // Toppings selection
        $$('input[name="toppings"]').forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selections.toppings.push({
                        name: e.target.value,
                        price: parseFloat(e.target.dataset.price)
                    });
                } else {
                    this.selections.toppings = this.selections.toppings.filter(
                        t => t.name !== e.target.value
                    );
                }
                this.updateToppingsPrice();
                this.updatePrice();
            });
        });
        
        // Topping category filter
        $$('.topping-category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.toppingCat;
                
                // Update active button
                $$('.topping-category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Filter toppings
                $$('.topping-card').forEach(card => {
                    if (category === 'all' || card.dataset.toppingType === category) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    },
    
    loadDefaults() {
        // Set default size
        const defaultSize = $('input[name="pizza-size"][checked]');
        if (defaultSize) {
            this.selections.size = defaultSize.value;
            this.prices.size = parseFloat(defaultSize.dataset.price);
        }
        
        // Set default crust
        const defaultCrust = $('input[name="pizza-crust"][checked]');
        if (defaultCrust) {
            this.selections.crust = defaultCrust.value;
            this.prices.crust = parseFloat(defaultCrust.dataset.price);
        }
        
        // Set default sauce
        const defaultSauce = $('input[name="pizza-sauce"][checked]');
        if (defaultSauce) {
            this.selections.sauce = defaultSauce.value;
            this.prices.sauce = parseFloat(defaultSauce.dataset.price);
        }
    },
    
    updateToppingsPrice() {
        this.prices.toppings = this.selections.toppings.reduce(
            (sum, topping) => sum + topping.price, 
            0
        );
    },
    
    updatePrice() {
        const total = this.prices.size + this.prices.crust + this.prices.sauce + this.prices.toppings;
        const priceElement = $('#builderTotal');
        
        if (priceElement) {
            priceElement.textContent = `$${total.toFixed(2)}`;
        }
    },
    
    open() {
        const modal = $('#builderModal');
        if (modal) {
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            this.goToStep(1);
        }
    },
    
    close() {
        const modal = $('#builderModal');
        if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            this.reset();
        }
    },
    
    reset() {
        this.currentStep = 1;
        this.selections.toppings = [];
        this.updateToppingsPrice();
        this.updatePrice();
        
        // Uncheck all toppings
        $$('input[name="toppings"]').forEach(input => {
            input.checked = false;
        });
    },
    
    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.goToStep(this.currentStep + 1);
        }
    },
    
    prevStep() {
        if (this.currentStep > 1) {
            this.goToStep(this.currentStep - 1);
        }
    },
    
    goToStep(step) {
        this.currentStep = step;
        
        // Update step indicators
        $$('.step').forEach((stepEl, index) => {
            const stepNum = index + 1;
            stepEl.classList.remove('active', 'completed');
            
            if (stepNum === step) {
                stepEl.classList.add('active');
            } else if (stepNum < step) {
                stepEl.classList.add('completed');
            }
        });
        
        // Show/hide step content
        $$('.builder-step').forEach(stepContent => {
            const contentStep = parseInt(stepContent.dataset.stepContent);
            stepContent.classList.toggle('active', contentStep === step);
        });
        
        // Update navigation buttons
        const prevBtn = $('#builderPrevBtn');
        const nextBtn = $('#builderNextBtn');
        const addBtn = $('#builderAddToCartBtn');
        
        if (prevBtn) {
            prevBtn.style.display = step === 1 ? 'none' : 'inline-flex';
        }
        
        if (nextBtn) {
            nextBtn.style.display = step === this.totalSteps ? 'none' : 'inline-flex';
        }
        
        if (addBtn) {
            addBtn.style.display = step === this.totalSteps ? 'inline-flex' : 'none';
        }
    },
    
    addToCart() {
        const total = this.prices.size + this.prices.crust + this.prices.sauce + this.prices.toppings;
        
        const item = {
            id: 'custom-' + Date.now(),
            name: 'Custom Pizza',
            price: total,
            customizations: {
                size: this.selections.size,
                crust: this.selections.crust,
                sauce: this.selections.sauce,
                toppings: this.selections.toppings.map(t => t.name)
            }
        };
        
        CartManager.add(item);
        this.close();
        
        // Open cart sidebar
        setTimeout(() => {
            CartManager.toggleSidebar();
        }, 300);
    }
};

// Quick Add to Cart
// ==========================================
const QuickAddManager = {
    init() {
        console.log('⚡ QuickAddManager initializing...');
        console.log('Add to cart buttons found:', $$('.btn-add-cart').length);
        
        $$('.btn-add-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Add to cart clicked:', btn.dataset);
                this.addToCart(btn);
            });
        });
        
        console.log('✅ QuickAddManager initialized');
    },
    
    addToCart(btn) {
        const pizzaId = btn.dataset.pizzaId;
        const pizzaName = btn.dataset.pizzaName;
        const basePrice = parseFloat(btn.dataset.basePrice);
        
        // Validation
        if (!pizzaId || !pizzaName || !basePrice) {
            console.error('Missing data attributes:', { pizzaId, pizzaName, basePrice });
            Toast.show('Error adding to cart', 'error');
            return;
        }
        
        // Get the card element to find image
        const card = btn.closest('.pizza-card');
        const img = card ? card.querySelector('.pizza-card__image img') : null;
        
        const item = {
            id: pizzaId,
            name: pizzaName,
            price: basePrice,
            image: img ? img.src : 'https://via.placeholder.com/80x80/f15a24/fff?text=Pizza',
            customizations: null
        };
        
        console.log('Adding item:', item);
        CartManager.add(item);
        
        // Visual feedback
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Added!';
        btn.style.background = 'var(--basil-green)';
        btn.style.borderColor = 'var(--basil-green)';
        btn.disabled = true;
        
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = '';
            btn.style.borderColor = '';
            btn.disabled = false;
        }, 1500);
    }
};

// Favorites Manager
// ==========================================
const FavoritesManager = {
    favorites: [],
    
    init() {
        console.log('⭐ FavoritesManager initializing...');
        this.loadFromStorage();
        this.bindEvents();
        this.updateUI();
        console.log('✅ FavoritesManager initialized');
    },
    
    loadFromStorage() {
        const saved = localStorage.getItem('pizzaFavorites');
        if (saved) {
            try {
                this.favorites = JSON.parse(saved);
            } catch (e) {
                this.favorites = [];
            }
        }
    },
    
    saveToStorage() {
        localStorage.setItem('pizzaFavorites', JSON.stringify(this.favorites));
    },
    
    bindEvents() {
        $$('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggle(btn);
            });
        });
    },
    
    toggle(btn) {
        const card = btn.closest('.pizza-card');
        const pizzaId = card ? card.querySelector('.btn-add-cart').dataset.pizzaId : null;
        
        if (!pizzaId) return;
        
        const index = this.favorites.indexOf(pizzaId);
        
        if (index > -1) {
            this.favorites.splice(index, 1);
            btn.classList.remove('active');
            Toast.show('Removed from favorites', 'info');
        } else {
            this.favorites.push(pizzaId);
            btn.classList.add('active');
            Toast.show('Added to favorites!', 'success');
        }
        
        this.saveToStorage();
    },
    
    updateUI() {
        $$('.favorite-btn').forEach(btn => {
            const card = btn.closest('.pizza-card');
            const pizzaId = card ? card.querySelector('.btn-add-cart').dataset.pizzaId : null;
            
            if (pizzaId && this.favorites.includes(pizzaId)) {
                btn.classList.add('active');
            }
        });
    }
};

// Location Manager
// ==========================================
const LocationManager = {
    currentLocation: null,
    
    init() {
        console.log('📍 LocationManager initializing...');
        this.loadFromStorage();
        this.updateBadge();
        this.bindEvents();
        console.log('✅ LocationManager initialized');
    },
    
    loadFromStorage() {
        const saved = localStorage.getItem('selectedLocation');
        if (saved) {
            try {
                this.currentLocation = JSON.parse(saved);
            } catch (e) {
                this.currentLocation = {
                    id: 'alden',
                    name: 'Alden Bridge',
                    address: '4775 W Panther Creek Dr'
                };
            }
        } else {
            // Default location
            this.currentLocation = {
                id: 'alden',
                name: 'Alden Bridge',
                address: '4775 W Panther Creek Dr'
            };
        }
    },
    
    saveToStorage() {
        localStorage.setItem('selectedLocation', JSON.stringify(this.currentLocation));
    },
    
    updateBadge() {
        const badge = $('#locationBadge');
        if (badge && this.currentLocation) {
            const nameElement = badge.querySelector('strong');
            if (nameElement) {
                nameElement.textContent = this.currentLocation.name;
            }
        }
    },
    
    bindEvents() {
        // Change location button
        const changeBtn = $('.change-location');
        if (changeBtn) {
            changeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal();
            });
        }
        
        // Location options in modal
        $$('.location-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const locationId = btn.dataset.location;
                this.selectLocation(locationId, btn);
            });
        });
        
        // Close modal buttons
        $$('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });
        
        // Detect location in modal
        const detectBtn = $('#detectLocationModal');
        if (detectBtn) {
            detectBtn.addEventListener('click', () => {
                this.detectLocation();
            });
        }
        
        // Search location
        const searchInput = $('#locationSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                this.searchLocation(e.target.value);
            }, 300));
        }
    },
    
    openModal() {
        const modal = $('#locationModal');
        if (modal) {
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            
            console.log('📍 Location modal opened');
        }
    },
    
    closeModal() {
        const modal = $('#locationModal');
        if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            
            console.log('📍 Location modal closed');
        }
    },
    
    selectLocation(locationId, btnElement) {
        // Get location details
        const nameElement = btnElement.querySelector('strong');
        const addressElement = btnElement.querySelector('span');
        
        if (nameElement && addressElement) {
            this.currentLocation = {
                id: locationId,
                name: nameElement.textContent,
                address: addressElement.textContent.split('•')[0].trim()
            };
            
            this.saveToStorage();
            this.updateBadge();
            this.closeModal();
            
            Toast.show(`Location changed to ${this.currentLocation.name}`, 'success');
            
            console.log('📍 Location selected:', this.currentLocation);
            
            // Track event
            if (typeof gtag !== 'undefined') {
                gtag('event', 'location_change', {
                    'event_category': 'User Interaction',
                    'event_label': this.currentLocation.name
                });
            }
        }
    },
    
    detectLocation() {
        if ('geolocation' in navigator) {
            const btn = $('#detectLocationModal');
            
            if (btn) {
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting...';
                btn.disabled = true;
                
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        console.log('📍 Location detected:', latitude, longitude);
                        
                        // Simulate finding nearest location
                        setTimeout(() => {
                            btn.innerHTML = '<i class="fas fa-check-circle"></i> Location Found!';
                            btn.style.background = 'var(--basil-green)';
                            btn.style.color = 'var(--white)';
                            
                            Toast.show('Location detected! Showing nearest stores.', 'success');
                            
                            // Reset button
                            setTimeout(() => {
                                btn.innerHTML = originalHTML;
                                btn.style.background = '';
                                btn.style.color = '';
                                btn.disabled = false;
                            }, 2000);
                        }, 1000);
                    },
                    (error) => {
                        console.error('Geolocation error:', error);
                        btn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Access Denied';
                        btn.style.background = 'var(--tomato-red)';
                        btn.style.color = 'var(--white)';
                        
                        Toast.show('Please enable location access in your browser', 'error');
                        
                        setTimeout(() => {
                            btn.innerHTML = originalHTML;
                            btn.style.background = '';
                            btn.style.color = '';
                            btn.disabled = false;
                        }, 2000);
                    }
                );
            }
        } else {
            Toast.show('Geolocation is not supported by your browser', 'error');
        }
    },
    
    searchLocation(query) {
        if (!query || query.length < 2) {
            // Show all locations
            $$('.location-option').forEach(option => {
                option.style.display = 'flex';
            });
            return;
        }
        
        const searchTerm = query.toLowerCase();
        let foundCount = 0;
        
        $$('.location-option').forEach(option => {
            const text = option.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                option.style.display = 'flex';
                foundCount++;
            } else {
                option.style.display = 'none';
            }
        });
        
        console.log(`📍 Search: "${query}" - Found ${foundCount} locations`);
    }
};

// Quick View Manager
// ==========================================
const QuickViewManager = {
    init() {
        console.log('👁️ QuickViewManager initializing...');
        
        $$('.quick-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const pizzaId = btn.dataset.pizza;
                this.show(pizzaId);
            });
        });
        
        console.log('✅ QuickViewManager initialized');
    },
    
    show(pizzaId) {

        Toast.show('Quick view feature - Click "Add to Cart" to customize', 'info', 2000);
    }
};


function checkAutoOpenCart() {

    const urlParams = new URLSearchParams(window.location.search);
    const urlFlag = urlParams.get('openCart');
    

    const sessionFlag = sessionStorage.getItem('autoOpenCart');
    
    if (urlFlag === 'true' || sessionFlag === 'true') {
        console.log('🛒 Auto-opening cart...');
        

        sessionStorage.removeItem('autoOpenCart');
        

        setTimeout(() => {
            if (typeof CartManager !== 'undefined' && CartManager.toggleSidebar) {

                CartManager.toggleSidebar();
                
                Toast.show('👋 Start adding pizzas to your cart!', 'info', 3000);
                

                if (urlFlag === 'true') {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            } else {
                console.error('CartManager not available');
            }
        }, 1000);
    }
}


function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {

        if (e.key === 'c' && !e.ctrlKey && !e.metaKey) {
            const searchInput = $('#menuSearch');
            if (document.activeElement !== searchInput) {
                CartManager.toggleSidebar();
            }
        }
        

        if (e.key === '/') {
            e.preventDefault();
            const searchInput = $('#menuSearch');
            if (searchInput) searchInput.focus();
        }
        

        if (e.key === 'Escape') {
            const cartSidebar = $('#cartSidebar');
            const builderModal = $('#builderModal');
            const locationModal = $('#locationModal');
            
            if (cartSidebar && cartSidebar.classList.contains('active')) {
                CartManager.closeSidebar();
            } else if (builderModal && builderModal.classList.contains('active')) {
                PizzaBuilder.close();
            } else if (locationModal && locationModal.classList.contains('active')) {
                LocationManager.closeModal();
            }
        }
    });
}


document.addEventListener('DOMContentLoaded', () => {
    console.log('%c🍕 Menu Page Loaded', 'font-size: 20px; font-weight: bold; color: #F15A24;');

    console.log('Cart sidebar:', $('#cartSidebar'));
    console.log('Cart items container:', $('#cartItems'));
    console.log('Add to cart buttons:', $$('.btn-add-cart').length);
    
 
    try {
        CartManager.init();
    } catch (e) {
        console.error('❌ CartManager error:', e);
    }
    
    try {
        MenuManager.init();
    } catch (e) {
        console.error('❌ MenuManager error:', e);
    }
    
    try {
        PizzaBuilder.init();
    } catch (e) {
        console.error('❌ PizzaBuilder error:', e);
    }
    
    try {
        QuickAddManager.init();
    } catch (e) {
        console.error('❌ QuickAddManager error:', e);
    }
    
    try {
        FavoritesManager.init();
    } catch (e) {
        console.error('❌ FavoritesManager error:', e);
    }
    
    try {
        LocationManager.init();
    } catch (e) {
        console.error('❌ LocationManager error:', e);
    }
    
    try {
        QuickViewManager.init();
    } catch (e) {
        console.error('❌ QuickViewManager error:', e);
    }
    

    initKeyboardShortcuts();
    
    console.log('✅ All managers initialized successfully');

    if (window.performance) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`⚡ Page load time: ${pageLoadTime}ms`);
    }
});

window.addEventListener('load', checkAutoOpenCart);


window.PizzaApp = {
    Cart: CartManager,
    Menu: MenuManager,
    Builder: PizzaBuilder,
    Favorites: FavoritesManager,
    Location: LocationManager,
    Toast: Toast
};

console.log('💡 Tip: Access CartManager via window.PizzaApp.Cart in console');
console.log('💡 Tip: Press "C" to toggle cart, "/" to search, "Esc" to close modals');