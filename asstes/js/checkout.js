// ==========================================
// CHECKOUT PAGE JAVASCRIPT - Chicago Pizza
// ==========================================
// Dependencies: main.js (provides $, $$, debounce utilities)

// Check if main.js utilities are available
if (typeof $ === 'undefined' || typeof $$ === 'undefined') {
    console.error('❌ Main.js utilities not found! Make sure main.js is loaded first.');
}

// Configuration
// ==========================================
const CONFIG = {
    TAX_RATE: 0.0825, // 8.25%
    DELIVERY_FEE: 3.99,
    FREE_DELIVERY_THRESHOLD: 25.00,
    DEFAULT_TIP: 3.00,
    PROMO_CODES: {
        'WELCOME10': { type: 'percentage', value: 10, description: '10% off your order' },
        'FREESHIP': { type: 'free_delivery', value: 0, description: 'Free delivery' },
        'PIZZA5': { type: 'fixed', value: 5, description: '$5 off your order' },
        'FIRST20': { type: 'percentage', value: 20, description: '20% off first order' }
    }
};

// Checkout State Manager
// ==========================================
const CheckoutState = {
    currentStep: 1,
    orderType: 'delivery',
    pickupLocation: null,
    customerInfo: {},
    paymentMethod: 'card',
    cardInfo: {},
    cart: [],
    promoCode: null,
    tip: CONFIG.DEFAULT_TIP,
    
    // Save state to sessionStorage
    save() {
        sessionStorage.setItem('checkoutState', JSON.stringify({
            currentStep: this.currentStep,
            orderType: this.orderType,
            pickupLocation: this.pickupLocation,
            customerInfo: this.customerInfo,
            paymentMethod: this.paymentMethod,
            promoCode: this.promoCode,
            tip: this.tip
        }));
    },
    
    // Load state from sessionStorage
    load() {
        const saved = sessionStorage.getItem('checkoutState');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                Object.assign(this, data);
                console.log('Checkout state restored:', data);
            } catch (e) {
                console.error('Error loading checkout state:', e);
            }
        }
    },
    
    // Clear state
    clear() {
        sessionStorage.removeItem('checkoutState');
        this.currentStep = 1;
        this.orderType = 'delivery';
        this.customerInfo = {};
        this.promoCode = null;
        this.tip = CONFIG.DEFAULT_TIP;
    }
};

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
        
        setTimeout(() => toast.style.transform = 'translateX(0)', 10);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

// Step Navigation Manager
// ==========================================
const StepManager = {
    init() {
        console.log('📍 StepManager initializing...');
        this.bindEvents();
        this.goToStep(CheckoutState.currentStep);
        console.log('✅ StepManager initialized');
    },
    
    bindEvents() {
        // Step navigation buttons
        $('#step1Next')?.addEventListener('click', () => this.validateAndNext(1));
        $('#step2Next')?.addEventListener('click', () => this.validateAndNext(2));
        $('#step3Next')?.addEventListener('click', () => this.validateAndNext(3));
        
        $('#step2Back')?.addEventListener('click', () => this.goToStep(1));
        $('#step3Back')?.addEventListener('click', () => this.goToStep(2));
        $('#step4Back')?.addEventListener('click', () => this.goToStep(3));
        
        // Edit buttons in review step
        $$('[data-edit-step]').forEach(btn => {
            btn.addEventListener('click', () => {
                const step = parseInt(btn.dataset.editStep);
                this.goToStep(step);
            });
        });
    },
    
    validateAndNext(currentStep) {
        let isValid = true;
        
        switch(currentStep) {
            case 1:
                isValid = OrderTypeManager.validate();
                break;
            case 2:
                isValid = FormManager.validate();
                break;
            case 3:
                isValid = PaymentManager.validate();
                break;
        }
        
        if (isValid) {
            this.goToStep(currentStep + 1);
        }
    },
    
    goToStep(step) {
        console.log(`Going to step ${step}`);
        
        // Update step state
        CheckoutState.currentStep = step;
        CheckoutState.save();
        
        // Hide all steps
        $$('.checkout-step').forEach(s => s.classList.remove('active'));
        
        // Show current step
        const currentStepEl = $(`.checkout-step[data-step="${step}"]`);
        if (currentStepEl) {
            currentStepEl.classList.add('active');
        }
        
        // Update step indicators
        $$('.step-indicator').forEach((indicator, index) => {
            const indicatorStep = index + 1;
            indicator.classList.remove('active', 'completed');
            
            if (indicatorStep === step) {
                indicator.classList.add('active');
            } else if (indicatorStep < step) {
                indicator.classList.add('completed');
            }
        });
        
        // Update review section if on step 4
        if (step === 4) {
            ReviewManager.updateReview();
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// Order Type Manager
// ==========================================
const OrderTypeManager = {
    init() {
        console.log('🚚 OrderTypeManager initializing...');
        this.bindEvents();
        this.updateUI();
        console.log('✅ OrderTypeManager initialized');
    },
    
    bindEvents() {
        $$('input[name="orderType"]').forEach(input => {
            input.addEventListener('change', (e) => {
                CheckoutState.orderType = e.target.value;
                CheckoutState.save();
                this.updateUI();
                PriceCalculator.calculate();
            });
        });
        
        const pickupSelect = $('#pickupLocation');
        if (pickupSelect) {
            pickupSelect.addEventListener('change', (e) => {
                CheckoutState.pickupLocation = e.target.value;
                CheckoutState.save();
            });
        }
    },
    
    updateUI() {
        const isDelivery = CheckoutState.orderType === 'delivery';
        
        // Show/hide pickup location selector
        const pickupSection = $('.pickup-location-section');
        if (pickupSection) {
            pickupSection.style.display = isDelivery ? 'none' : 'block';
        }
        
        // Update delivery sections in step 2
        const deliverySection = $('.delivery-section');
        const pickupSectionStep2 = $('.pickup-section');
        
        if (deliverySection) deliverySection.style.display = isDelivery ? 'block' : 'none';
        if (pickupSectionStep2) pickupSectionStep2.style.display = isDelivery ? 'none' : 'block';
        
        // Update tip section visibility
        const tipSection = $('#tipSection');
        if (tipSection) {
            tipSection.style.display = isDelivery ? 'block' : 'none';
        }
        
        // Update estimated time
        const estimatedTime = $('#estimatedTime');
        if (estimatedTime) {
            const timeText = isDelivery ? 'Estimated delivery: 30-40 min' : 'Ready for pickup: 15-20 min';
            estimatedTime.textContent = timeText;
        }
    },
    
    validate() {
        if (CheckoutState.orderType === 'pickup') {
            const pickupLocation = $('#pickupLocation').value;
            if (!pickupLocation) {
                Toast.show('Please select a pickup location', 'error');
                $('#pickupLocation').focus();
                return false;
            }
            CheckoutState.pickupLocation = pickupLocation;
        }
        return true;
    }
};

// Form Manager
// ==========================================
const FormManager = {
    init() {
        console.log('📝 FormManager initializing...');
        this.bindEvents();
        this.loadSavedInfo();
        console.log('✅ FormManager initialized');
    },
    
    bindEvents() {
        const form = $('#detailsForm');
        if (!form) return;
        
        // Real-time validation
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
        
        // Phone formatting
        const phoneInput = $('#phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 10) value = value.substr(0, 10);
                
                if (value.length >= 6) {
                    value = `(${value.substr(0, 3)}) ${value.substr(3, 3)}-${value.substr(6)}`;
                } else if (value.length >= 3) {
                    value = `(${value.substr(0, 3)}) ${value.substr(3)}`;
                }
                
                e.target.value = value;
            });
        }
        
        // ZIP code formatting
        const zipInput = $('#zipCode');
        if (zipInput) {
            zipInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').substr(0, 5);
            });
        }
    },
    
    loadSavedInfo() {
        const saved = localStorage.getItem('customerInfo');
        if (saved) {
            try {
                const info = JSON.parse(saved);
                Object.keys(info).forEach(key => {
                    const input = $(`#${key}`);
                    if (input) input.value = info[key];
                });
                console.log('Customer info loaded from localStorage');
            } catch (e) {
                console.error('Error loading customer info:', e);
            }
        }
    },
    
    validateField(field) {
        const value = field.value.trim();
        
        // Required fields
        if (field.hasAttribute('required') && !value) {
            this.showFieldError(field, 'This field is required');
            return false;
        }
        
        // Email validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.showFieldError(field, 'Please enter a valid email');
                return false;
            }
        }
        
        // Phone validation
        if (field.id === 'phone' && value) {
            const phoneDigits = value.replace(/\D/g, '');
            if (phoneDigits.length !== 10) {
                this.showFieldError(field, 'Please enter a valid 10-digit phone number');
                return false;
            }
        }
        
        // ZIP code validation
        if (field.id === 'zipCode' && value && CheckoutState.orderType === 'delivery') {
            if (value.length !== 5) {
                this.showFieldError(field, 'Please enter a valid 5-digit ZIP code');
                return false;
            }
        }
        
        this.clearFieldError(field);
        return true;
    },
    
    showFieldError(field, message) {
        field.classList.add('error');
        field.style.borderColor = 'var(--tomato-red)';
        
        // Remove existing error
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) existingError.remove();
        
        // Add error message
        const errorMsg = document.createElement('span');
        errorMsg.className = 'field-error';
        errorMsg.style.cssText = `
            display: block;
            color: var(--tomato-red);
            font-size: var(--text-sm);
            margin-top: var(--space-1);
        `;
        errorMsg.textContent = message;
        field.parentElement.appendChild(errorMsg);
    },
    
    clearFieldError(field) {
        field.classList.remove('error');
        field.style.borderColor = '';
        
        const errorMsg = field.parentElement.querySelector('.field-error');
        if (errorMsg) errorMsg.remove();
    },
    
    validate() {
        const form = $('#detailsForm');
        if (!form) return false;
        
        let isValid = true;
        const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
        
        // Add delivery-specific required fields
        if (CheckoutState.orderType === 'delivery') {
            requiredFields.push('address', 'city', 'state', 'zipCode');
        }
        
        requiredFields.forEach(fieldId => {
            const field = $(`#${fieldId}`);
            if (field && !this.validateField(field)) {
                isValid = false;
            }
        });
        
        if (!isValid) {
            Toast.show('Please fill in all required fields correctly', 'error');
            const firstError = form.querySelector('.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
            return false;
        }
        
        // Save customer info
        this.saveCustomerInfo();
        
        return true;
    },
    
    saveCustomerInfo() {
        const info = {
            firstName: $('#firstName')?.value,
            lastName: $('#lastName')?.value,
            email: $('#email')?.value,
            phone: $('#phone')?.value,
            address: $('#address')?.value,
            apartment: $('#apartment')?.value,
            city: $('#city')?.value,
            state: $('#state')?.value,
            zipCode: $('#zipCode')?.value,
            deliveryInstructions: $('#deliveryInstructions')?.value
        };
        
        CheckoutState.customerInfo = info;
        CheckoutState.save();
        
        // Save for future if checkbox is checked
        const saveInfoCheckbox = $('input[name="saveInfo"]');
        if (saveInfoCheckbox?.checked) {
            localStorage.setItem('customerInfo', JSON.stringify(info));
            console.log('Customer info saved to localStorage');
        }
    }
};

// Payment Manager
// ==========================================
const PaymentManager = {
    init() {
        console.log('💳 PaymentManager initializing...');
        this.bindEvents();
        this.updatePaymentForm();
        console.log('✅ PaymentManager initialized');
    },
    
    bindEvents() {
        // Payment method selection
        $$('input[name="paymentMethod"]').forEach(input => {
            input.addEventListener('change', (e) => {
                CheckoutState.paymentMethod = e.target.value;
                CheckoutState.save();
                this.updatePaymentForm();
            });
        });
        
        // Card number formatting
        const cardNumber = $('#cardNumber');
        if (cardNumber) {
            cardNumber.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 16) value = value.substr(0, 16);
                
                // Format with spaces every 4 digits
                value = value.match(/.{1,4}/g)?.join(' ') || value;
                e.target.value = value;
                
                // Detect card type
                this.detectCardType(value);
            });
        }
        
        // Expiry date formatting
        const cardExpiry = $('#cardExpiry');
        if (cardExpiry) {
            cardExpiry.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.substr(0, 2) + '/' + value.substr(2, 2);
                }
                e.target.value = value;
            });
        }
        
        // CVV - numbers only
        const cardCVV = $('#cardCVV');
        if (cardCVV) {
            cardCVV.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').substr(0, 4);
            });
        }
    },
    
    updatePaymentForm() {
        const cardForm = $('.card-payment-form');
        if (cardForm) {
            cardForm.classList.toggle('active', CheckoutState.paymentMethod === 'card');
        }
    },
    
    detectCardType(number) {
        const cleaned = number.replace(/\s/g, '');
        let type = '';
        
        if (/^4/.test(cleaned)) type = 'visa';
        else if (/^5[1-5]/.test(cleaned)) type = 'mastercard';
        else if (/^3[47]/.test(cleaned)) type = 'amex';
        else if (/^6(?:011|5)/.test(cleaned)) type = 'discover';
        
        const iconMap = {
            visa: '<i class="fab fa-cc-visa"></i>',
            mastercard: '<i class="fab fa-cc-mastercard"></i>',
            amex: '<i class="fab fa-cc-amex"></i>',
            discover: '<i class="fab fa-cc-discover"></i>'
        };
        
        const cardTypeIcon = $('.card-type-icon');
        if (cardTypeIcon) {
            cardTypeIcon.innerHTML = iconMap[type] || '';
        }
    },
    
    validate() {
        if (CheckoutState.paymentMethod === 'card') {
            const cardNumber = $('#cardNumber')?.value.replace(/\s/g, '');
            const cardExpiry = $('#cardExpiry')?.value;
            const cardCVV = $('#cardCVV')?.value;
            const cardName = $('#cardName')?.value;
            
            if (!cardNumber || cardNumber.length < 15) {
                Toast.show('Please enter a valid card number', 'error');
                $('#cardNumber')?.focus();
                return false;
            }
            
            if (!cardExpiry || cardExpiry.length !== 5) {
                Toast.show('Please enter a valid expiry date (MM/YY)', 'error');
                $('#cardExpiry')?.focus();
                return false;
            }
            
            if (!cardCVV || cardCVV.length < 3) {
                Toast.show('Please enter a valid CVV', 'error');
                $('#cardCVV')?.focus();
                return false;
            }
            
            if (!cardName || cardName.trim().length < 3) {
                Toast.show('Please enter the name on card', 'error');
                $('#cardName')?.focus();
                return false;
            }
            
            // Save card info (masked)
            CheckoutState.cardInfo = {
                lastFour: cardNumber.substr(-4),
                type: this.getCardType(cardNumber)
            };
        }
        
        return true;
    },
    
    getCardType(number) {
        if (/^4/.test(number)) return 'Visa';
        if (/^5[1-5]/.test(number)) return 'Mastercard';
        if (/^3[47]/.test(number)) return 'American Express';
        if (/^6(?:011|5)/.test(number)) return 'Discover';
        return 'Card';
    }
};

// Cart Manager
// ==========================================
const CartManager = {
    init() {
        console.log('🛒 CartManager initializing...');
        this.loadCart();
        this.renderCart();
        console.log('✅ CartManager initialized');
    },
    
    loadCart() {
        const saved = localStorage.getItem('pizzaCart');
        if (saved) {
            try {
                CheckoutState.cart = JSON.parse(saved);
                console.log('Cart loaded:', CheckoutState.cart);
            } catch (e) {
                console.error('Error loading cart:', e);
                CheckoutState.cart = [];
            }
        }
    },
    
    renderCart() {
        const summaryItems = $('#summaryItems');
        if (!summaryItems) return;
        
        if (CheckoutState.cart.length === 0) {
            summaryItems.innerHTML = `
                <div class="empty-cart-message">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                    <a href="menu.html" class="btn-primary btn-sm">Browse Menu</a>
                </div>
            `;
            return;
        }
        
        summaryItems.innerHTML = CheckoutState.cart.map(item => `
            <div class="summary-item">
                <div class="summary-item-image">
                    <img src="${item.image || 'https://via.placeholder.com/60x60/f15a24/fff?text=Pizza'}" 
                         alt="${item.name}"
                         onerror="this.src='https://via.placeholder.com/60x60/f15a24/fff?text=Pizza'">
                </div>
                <div class="summary-item-details">
                    <div class="summary-item-name">${item.name}</div>
                    ${item.customizations ? `
                        <div class="summary-item-options">${this.formatCustomizations(item.customizations)}</div>
                    ` : ''}
                    <div class="summary-item-quantity">Qty: ${item.quantity}</div>
                </div>
                <div class="summary-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        `).join('');
        
        PriceCalculator.calculate();
    },
    
    formatCustomizations(custom) {
        const parts = [];
        if (custom.size) parts.push(custom.size);
        if (custom.crust) parts.push(`${custom.crust} crust`);
        if (custom.toppings && custom.toppings.length > 0) {
            parts.push(`${custom.toppings.length} toppings`);
        }
        return parts.join(' • ');
    }
};

// Price Calculator
// ==========================================
const PriceCalculator = {
    calculate() {
        const subtotal = this.getSubtotal();
        const deliveryFee = this.getDeliveryFee(subtotal);
        const tip = this.getTip();
        const discount = this.getDiscount(subtotal);
        const taxableAmount = subtotal - discount;
        const tax = taxableAmount * CONFIG.TAX_RATE;
        const total = subtotal + deliveryFee + tip + tax - discount;
        
        this.updateUI(subtotal, deliveryFee, tip, discount, tax, total);
        
        return { subtotal, deliveryFee, tip, discount, tax, total };
    },
    
    getSubtotal() {
        return CheckoutState.cart.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0
        );
    },
    
    getDeliveryFee(subtotal) {
        if (CheckoutState.orderType !== 'delivery') return 0;
        
        // Check if promo code gives free delivery
        if (CheckoutState.promoCode && CONFIG.PROMO_CODES[CheckoutState.promoCode]?.type === 'free_delivery') {
            return 0;
        }
        
        // Free delivery over threshold
        if (subtotal >= CONFIG.FREE_DELIVERY_THRESHOLD) return 0;
        
        return CONFIG.DELIVERY_FEE;
    },
    
    getTip() {
        if (CheckoutState.orderType !== 'delivery') return 0;
        return CheckoutState.tip || 0;
    },
    
    getDiscount(subtotal) {
        if (!CheckoutState.promoCode) return 0;
        
        const promo = CONFIG.PROMO_CODES[CheckoutState.promoCode];
        if (!promo) return 0;
        
        if (promo.type === 'percentage') {
            return subtotal * (promo.value / 100);
        } else if (promo.type === 'fixed') {
            return promo.value;
        }
        
        return 0;
    },
    
    updateUI(subtotal, deliveryFee, tip, discount, tax, total) {
        $('#summarySubtotal').textContent = `$${subtotal.toFixed(2)}`;
        $('#summaryDeliveryFee').textContent = deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`;
        $('#summaryTip').textContent = `$${tip.toFixed(2)}`;
        $('#summaryDiscount').textContent = `-$${discount.toFixed(2)}`;
        $('#summaryTax').textContent = `$${tax.toFixed(2)}`;
        $('#summaryTotal').textContent = `$${total.toFixed(2)}`;
        
        // Show/hide rows
        $('#tipRow').style.display = tip > 0 ? 'flex' : 'none';
        $('#discountRow').style.display = discount > 0 ? 'flex' : 'none';
        
        // Show delivery fee only for delivery
        $('.delivery-fee-row').style.display = 
            CheckoutState.orderType === 'delivery' ? 'flex' : 'none';
    }
};

// Promo Code Manager
// ==========================================
const PromoCodeManager = {
    init() {
        console.log('🎫 PromoCodeManager initializing...');
        this.bindEvents();
        console.log('✅ PromoCodeManager initialized');
    },
    
    bindEvents() {
        const applyBtn = $('#applyPromoBtn');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.apply());
        }
        
        const promoInput = $('#promoCode');
        if (promoInput) {
            promoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.apply();
                }
            });
        }
    },
    
    apply() {
        const input = $('#promoCode');
        const code = input.value.trim().toUpperCase();
        const message = $('#promoMessage');
        
        if (!code) {
            this.showMessage('Please enter a promo code', 'error');
            return;
        }
        
        if (!CONFIG.PROMO_CODES[code]) {
            this.showMessage('Invalid promo code', 'error');
            return;
        }
        
        CheckoutState.promoCode = code;
        CheckoutState.save();
        
        const promo = CONFIG.PROMO_CODES[code];
        this.showMessage(`✓ ${promo.description} applied!`, 'success');
        
        // Update discount code display
        $('.discount-code').textContent = `(${code})`;
        
        PriceCalculator.calculate();
        
        // Disable input and button
        input.disabled = true;
        $('#applyPromoBtn').disabled = true;
        $('#applyPromoBtn').textContent = 'Applied';
        
        Toast.show(`Promo code "${code}" applied successfully!`, 'success');
    },
    
    showMessage(text, type) {
        const message = $('#promoMessage');
        if (message) {
            message.textContent = text;
            message.className = `promo-message ${type}`;
        }
    }
};

// Tip Manager
// ==========================================
const TipManager = {
    init() {
        console.log('💰 TipManager initializing...');
        this.bindEvents();
        console.log('✅ TipManager initialized');
    },
    
    bindEvents() {
        $$('.tip-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tipValue = btn.dataset.tip;
                
                // Remove active from all
                $$('.tip-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const customInput = $('#customTip');
                
                if (tipValue === 'custom') {
                    customInput.style.display = 'block';
                    customInput.focus();
                    CheckoutState.tip = parseFloat(customInput.value) || 0;
                } else {
                    customInput.style.display = 'none';
                    CheckoutState.tip = parseFloat(tipValue);
                }
                
                CheckoutState.save();
                PriceCalculator.calculate();
            });
        });
        
        const customInput = $('#customTip');
        if (customInput) {
            customInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value) || 0;
                CheckoutState.tip = value;
                CheckoutState.save();
                PriceCalculator.calculate();
            });
        }
    }
};

// Review Manager
// ==========================================
const ReviewManager = {
    updateReview() {
        console.log('Updating review section...');
        
        // Order Type
        const orderTypeText = CheckoutState.orderType === 'delivery' 
            ? 'Delivery<br>Expected: 30-40 minutes'
            : `Pickup from ${CheckoutState.pickupLocation || 'Selected Location'}<br>Ready: 15-20 minutes`;
        $('#reviewOrderType').innerHTML = `<p>${orderTypeText}</p>`;
        
        // Contact & Address
        const info = CheckoutState.customerInfo;
        let addressHTML = `
            <p><strong>${info.firstName} ${info.lastName}</strong></p>
            <p>${info.email}</p>
            <p>${info.phone}</p>
        `;
        
        if (CheckoutState.orderType === 'delivery') {
            addressHTML += `
                <p style="margin-top: var(--space-3);">
                    ${info.address}${info.apartment ? ', ' + info.apartment : ''}<br>
                    ${info.city}, ${info.state} ${info.zipCode}
                </p>
            `;
            if (info.deliveryInstructions) {
                addressHTML += `<p style="margin-top: var(--space-2);"><em>${info.deliveryInstructions}</em></p>`;
            }
        }
        
        $('#reviewContactAddress').innerHTML = addressHTML;
        
        // Payment
        let paymentHTML = '';
        if (CheckoutState.paymentMethod === 'card') {
            paymentHTML = `
                <p><strong>Credit/Debit Card</strong></p>
                <p>${CheckoutState.cardInfo.type} ending in ${CheckoutState.cardInfo.lastFour}</p>
            `;
        } else if (CheckoutState.paymentMethod === 'cash') {
            paymentHTML = `<p><strong>Cash on ${CheckoutState.orderType === 'delivery' ? 'Delivery' : 'Pickup'}</strong></p>`;
        } else if (CheckoutState.paymentMethod === 'paypal') {
            paymentHTML = `<p><strong>PayPal</strong></p>`;
        }
        
        $('#reviewPayment').innerHTML = paymentHTML;
    }
};

// Order Placement Manager
// ==========================================
const OrderManager = {
    init() {
        console.log('📦 OrderManager initializing...');
        this.bindEvents();
        console.log('✅ OrderManager initialized');
    },
    
    bindEvents() {
        const placeOrderBtn = $('#placeOrderBtn');
        const acceptTerms = $('#acceptTerms');
        
        if (acceptTerms) {
            acceptTerms.addEventListener('change', (e) => {
                if (placeOrderBtn) {
                    placeOrderBtn.disabled = !e.target.checked;
                }
            });
        }
        
        if (placeOrderBtn) {
            placeOrderBtn.addEventListener('click', () => this.placeOrder());
        }
    },
    
    async placeOrder() {
        const btn = $('#placeOrderBtn');
        
        // Check terms acceptance
        if (!$('#acceptTerms').checked) {
            Toast.show('Please accept the terms and conditions', 'error');
            return;
        }
        
        // Set loading state
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        try {
            // Simulate API call
            const orderData = this.prepareOrderData();
            const result = await this.submitOrder(orderData);
            
            console.log('Order placed:', result);
            
            // Show success modal
            this.showSuccess(result);
            
            // Clear cart and state
            this.cleanup();
            
        } catch (error) {
            console.error('Order placement error:', error);
            Toast.show('Failed to place order. Please try again.', 'error');
            
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check-circle"></i> Place Order';
        }
    },
    
    prepareOrderData() {
        const prices = PriceCalculator.calculate();
        const orderNotes = $('#orderNotes')?.value;
        
        return {
            orderType: CheckoutState.orderType,
            pickupLocation: CheckoutState.pickupLocation,
            customer: CheckoutState.customerInfo,
            items: CheckoutState.cart,
            payment: {
                method: CheckoutState.paymentMethod,
                cardInfo: CheckoutState.cardInfo
            },
            pricing: prices,
            promoCode: CheckoutState.promoCode,
            tip: CheckoutState.tip,
            notes: orderNotes,
            timestamp: new Date().toISOString()
        };
    },
    
    async submitOrder(orderData) {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    orderId: 'ORD-' + Date.now(),
                    estimatedTime: CheckoutState.orderType === 'delivery' ? '30-40 minutes' : '15-20 minutes'
                });
            }, 2000);
        });
        
        /* Real API call:
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        return await response.json();
        */
    },
    
    showSuccess(result) {
        const modal = $('#successModal');
        if (!modal) return;
        
        // Update modal content
        $('#orderNumber').textContent = result.orderId;
        $('#confirmEmail').textContent = CheckoutState.customerInfo.email;
        $('#successETA').textContent = result.estimatedTime;
        
        // Update final step text
        $('#finalStep').textContent = CheckoutState.orderType === 'delivery' ? 'On the Way' : 'Ready for Pickup';
        
        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Track conversion
        if (typeof gtag !== 'undefined') {
            const prices = PriceCalculator.calculate();
            gtag('event', 'purchase', {
                transaction_id: result.orderId,
                value: prices.total,
                currency: 'USD',
                items: CheckoutState.cart.map(item => ({
                    item_id: item.id,
                    item_name: item.name,
                    price: item.price,
                    quantity: item.quantity
                }))
            });
        }
    },
    
    cleanup() {
        // Clear cart
        localStorage.removeItem('pizzaCart');
        
        // Clear checkout state
        CheckoutState.clear();
        
        console.log('Checkout completed and cleaned up');
    }
};


document.addEventListener('DOMContentLoaded', () => {
    console.log('%c🛒 Checkout Page Loaded', 'font-size: 20px; font-weight: bold; color: #F15A24;');
    

    CheckoutState.load();
    
    try {
        CartManager.init();
    } catch (e) {
        console.error('❌ CartManager error:', e);
    }
    
    try {
        StepManager.init();
    } catch (e) {
        console.error('❌ StepManager error:', e);
    }
    
    try {
        OrderTypeManager.init();
    } catch (e) {
        console.error('❌ OrderTypeManager error:', e);
    }
    
    try {
        FormManager.init();
    } catch (e) {
        console.error('❌ FormManager error:', e);
    }
    
    try {
        PaymentManager.init();
    } catch (e) {
        console.error('❌ PaymentManager error:', e);
    }
    
    try {
        PromoCodeManager.init();
    } catch (e) {
        console.error('❌ PromoCodeManager error:', e);
    }
    
    try {
        TipManager.init();
    } catch (e) {
        console.error('❌ TipManager error:', e);
    }
    
    try {
        OrderManager.init();
    } catch (e) {
        console.error('❌ OrderManager error:', e);
    }
    
    console.log('✅ All checkout managers initialized');
    

    if (window.performance) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`⚡ Page load time: ${pageLoadTime}ms`);
    }
});


window.addEventListener('beforeunload', (e) => {
    if (CheckoutState.cart.length > 0 && CheckoutState.currentStep < 4) {
        e.preventDefault();
        e.returnValue = 'You have items in your cart. Are you sure you want to leave?';
        return e.returnValue;
    }
});


window.CheckoutApp = {
    State: CheckoutState,
    Step: StepManager,
    Cart: CartManager,
    Price: PriceCalculator,
    Order: OrderManager
};

console.log('💡 Tip: Access checkout managers via window.CheckoutApp in console');
console.log('💡 Promo codes: WELCOME10, FREESHIP, PIZZA5, FIRST20');