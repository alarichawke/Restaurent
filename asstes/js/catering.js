// ==========================================
// CATERING PAGE JAVASCRIPT - Chicago Pizza
// ==========================================
// Dependencies: main.js (provides $, $$, debounce utilities)

// Check if main.js utilities are available
if (typeof $ === 'undefined' || typeof $$ === 'undefined') {
    console.error('❌ Main.js utilities not found! Make sure main.js is loaded first.');
}

// Toast Notification System (Reusable)
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
        
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

// FAQ Accordion Manager
// ==========================================
const FAQManager = {
    init() {
        console.log('❓ FAQManager initializing...');
        this.bindEvents();
        console.log('✅ FAQManager initialized');
    },
    
    bindEvents() {
        $$('.faq-question').forEach(question => {
            question.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleFAQ(question);
            });
        });
    },
    
    toggleFAQ(questionBtn) {
        const faqItem = questionBtn.closest('.faq-item');
        const isActive = faqItem.classList.contains('active');
        
        // Close all other FAQs
        $$('.faq-item').forEach(item => {
            if (item !== faqItem) {
                item.classList.remove('active');
            }
        });
        
        // Toggle current FAQ
        faqItem.classList.toggle('active');
        
        // Track event
        if (!isActive) {
            const questionText = questionBtn.querySelector('span').textContent;
            console.log('FAQ opened:', questionText);
            
            if (typeof gtag !== 'undefined') {
                gtag('event', 'faq_open', {
                    'event_category': 'Engagement',
                    'event_label': questionText
                });
            }
        }
    }
};

// Package Selection Manager
// ==========================================
const PackageManager = {
    selectedPackage: null,
    
    init() {
        console.log('📦 PackageManager initializing...');
        this.bindEvents();
        this.checkURLParams();
        console.log('✅ PackageManager initialized');
    },
    
    bindEvents() {
        // Package selection buttons
        $$('[data-package]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const packageType = btn.dataset.package;
                this.selectPackage(packageType);
            });
        });
    },
    
    selectPackage(packageType) {
        this.selectedPackage = packageType;
        
        console.log('Package selected:', packageType);
        
        // Scroll to quote form
        const quoteForm = $('#quote-form');
        if (quoteForm) {
            quoteForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Pre-select package in form
            setTimeout(() => {
                const packageSelect = $('#packageType');
                if (packageSelect) {
                    packageSelect.value = packageType;
                    packageSelect.focus();
                    
                    // Highlight the field briefly
                    packageSelect.style.transition = 'all 0.3s ease';
                    packageSelect.style.borderColor = 'var(--primary-orange)';
                    packageSelect.style.boxShadow = '0 0 0 3px rgba(241, 90, 36, 0.1)';
                    
                    setTimeout(() => {
                        packageSelect.style.borderColor = '';
                        packageSelect.style.boxShadow = '';
                    }, 2000);
                }
            }, 800);
        }
        
        // Show toast notification
        const packageNames = {
            basic: 'Basic Package',
            deluxe: 'Deluxe Package',
            premium: 'Premium Package',
            custom: 'Custom Package'
        };
        
        Toast.show(`${packageNames[packageType]} selected! Complete the form below.`, 'success', 3000);
        
        // Track event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'package_selected', {
                'event_category': 'Catering',
                'event_label': packageType
            });
        }
    },
    
    checkURLParams() {
        // Check if package is specified in URL
        const urlParams = new URLSearchParams(window.location.search);
        const packageParam = urlParams.get('package');
        
        if (packageParam) {
            console.log('Package from URL:', packageParam);
            this.selectPackage(packageParam);
        }
    }
};

// Quote Form Manager
// ==========================================
const QuoteFormManager = {
    form: null,
    
    init() {
        console.log('📝 QuoteFormManager initializing...');
        this.form = $('#cateringQuoteForm');
        
        if (this.form) {
            this.bindEvents();
            this.setupValidation();
            console.log('✅ QuoteFormManager initialized');
        } else {
            console.warn('⚠️ Quote form not found');
        }
    },
    
    bindEvents() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit(e);
        });
        
        // Real-time validation
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                // Remove error state on input
                if (input.classList.contains('error')) {
                    input.classList.remove('error');
                }
            });
        });
        
        // Date input - set minimum to today
        const eventDate = $('#eventDate');
        if (eventDate) {
            const today = new Date().toISOString().split('T')[0];
            eventDate.min = today;
        }
        
        // Guest count validation
        const guestCount = $('#guestCount');
        if (guestCount) {
            guestCount.addEventListener('change', () => {
                const count = parseInt(guestCount.value);
                if (count < 10) {
                    Toast.show('Minimum 10 guests required for catering', 'info');
                    guestCount.value = 10;
                }
            });
        }
    },
    
    setupValidation() {
        // Add custom validation messages
        const requiredFields = this.form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            field.addEventListener('invalid', (e) => {
                e.preventDefault();
                this.showFieldError(field);
            });
        });
    },
    
    validateField(field) {
        if (field.hasAttribute('required') && !field.value.trim()) {
            this.showFieldError(field, 'This field is required');
            return false;
        }
        
        // Email validation
        if (field.type === 'email' && field.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value)) {
                this.showFieldError(field, 'Please enter a valid email address');
                return false;
            }
        }
        
        // Phone validation (basic)
        if (field.type === 'tel' && field.value) {
            const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
            if (!phoneRegex.test(field.value)) {
                this.showFieldError(field, 'Please enter a valid phone number');
                return false;
            }
        }
        
        // Date validation
        if (field.type === 'date' && field.value) {
            const selectedDate = new Date(field.value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) {
                this.showFieldError(field, 'Event date must be in the future');
                return false;
            }
        }
        
        this.clearFieldError(field);
        return true;
    },
    
    showFieldError(field, message = 'This field is required') {
        field.classList.add('error');
        field.style.borderColor = 'var(--tomato-red)';
        
        // Remove existing error message
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
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
        if (errorMsg) {
            errorMsg.remove();
        }
    },
    
    validateForm() {
        let isValid = true;
        const requiredFields = this.form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    },
    
    async handleSubmit(e) {
        console.log('📤 Form submission started');
        
        // Validate form
        if (!this.validateForm()) {
            Toast.show('Please fill in all required fields correctly', 'error', 4000);
            
            // Scroll to first error
            const firstError = this.form.querySelector('.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
            return;
        }
        
        // Collect form data
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());
        
        console.log('Form data:', data);
        
        // Show loading state
        this.setLoadingState(true);
        
        try {
            // Simulate API call (replace with actual endpoint)
            await this.submitToServer(data);
            
            // Success
            this.handleSuccess(data);
            
        } catch (error) {
            console.error('Submission error:', error);
            this.handleError(error);
        } finally {
            this.setLoadingState(false);
        }
    },
    
    async submitToServer(data) {
        // Simulate API call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate 95% success rate
                if (Math.random() > 0.05) {
                    resolve({ success: true, quoteId: 'QT-' + Date.now() });
                } else {
                    reject(new Error('Server error'));
                }
            }, 2000);
        });
        
        /* 
        // Real API call example:
        const response = await fetch('/api/catering/quote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit quote request');
        }
        
        return await response.json();
        */
    },
    
    setLoadingState(loading) {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        
        if (loading) {
            submitBtn.disabled = true;
            submitBtn.dataset.originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            this.form.classList.add('loading');
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = submitBtn.dataset.originalText;
            this.form.classList.remove('loading');
        }
    },
    
    handleSuccess(data) {
        console.log('✅ Quote request submitted successfully');
        
        // Show success message
        Toast.show('Quote request submitted successfully! We\'ll contact you within 24 hours.', 'success', 5000);
        
        // Track conversion
        if (typeof gtag !== 'undefined') {
            gtag('event', 'quote_submitted', {
                'event_category': 'Catering',
                'event_label': data.eventType,
                'value': parseInt(data.guestCount)
            });
        }
        
        // Show success overlay or redirect
        this.showSuccessMessage(data);
        
        // Reset form after delay
        setTimeout(() => {
            this.form.reset();
            $$('.field-error').forEach(error => error.remove());
        }, 3000);
    },
    
    handleError(error) {
        console.error('❌ Quote submission failed:', error);
        
        Toast.show('Something went wrong. Please try again or call us at (281) 555-1234', 'error', 5000);
        
        // Track error
        if (typeof gtag !== 'undefined') {
            gtag('event', 'quote_error', {
                'event_category': 'Error',
                'event_label': error.message
            });
        }
    },
    
    showSuccessMessage(data) {
        // Create success modal/overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(4px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;
        
        overlay.innerHTML = `
            <div style="
                background: white;
                padding: 3rem;
                border-radius: 1rem;
                max-width: 500px;
                text-align: center;
                animation: slideUp 0.3s ease;
            ">
                <div style="
                    width: 80px;
                    height: 80px;
                    background: var(--basil-green);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                ">
                    <i class="fas fa-check" style="font-size: 2.5rem; color: white;"></i>
                </div>
                <h2 style="font-size: 2rem; margin-bottom: 1rem; color: var(--charcoal);">
                    Thank You, ${data.fullName}!
                </h2>
                <p style="font-size: 1.125rem; color: var(--gray-dark); margin-bottom: 1.5rem; line-height: 1.6;">
                    Your catering quote request has been received. Our team will contact you within 24 hours at <strong>${data.email}</strong> or <strong>${data.phone}</strong>.
                </p>
                <p style="font-size: 0.875rem; color: var(--gray-medium); margin-bottom: 2rem;">
                    Event Date: <strong>${data.eventDate}</strong><br>
                    Guests: <strong>${data.guestCount}</strong><br>
                    Package: <strong>${data.packageType || 'To be discussed'}</strong>
                </p>
                <button onclick="this.closest('div').parentElement.remove()" 
                        class="btn-primary btn-lg">
                    <i class="fas fa-check"></i> Got It!
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        }, 10000);
    }
};

// Smooth Scroll Manager
// ==========================================
const ScrollManager = {
    init() {
        console.log('📜 ScrollManager initializing...');
        this.bindEvents();
        console.log('✅ ScrollManager initialized');
    },
    
    bindEvents() {
        // Request Quote buttons
        const requestQuoteBtns = ['#requestQuoteBtn', '#viewPackagesBtn'];
        
        requestQuoteBtns.forEach(selector => {
            const btn = $(selector);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    if (selector === '#viewPackagesBtn') {
                        this.scrollToSection('#packages');
                    } else {
                        this.scrollToSection('#quote-form');
                    }
                });
            }
        });
        
        // All anchor links
        $$('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href !== '#') {
                    e.preventDefault();
                    this.scrollToSection(href);
                }
            });
        });
    },
    
    scrollToSection(selector) {
        const target = $(selector);
        if (target) {
            const header = $('#header');
            const headerHeight = header ? header.offsetHeight : 80;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
            
            console.log('Scrolled to:', selector);
        }
    }
};

// Gallery Manager (Optional - for lightbox)
// ==========================================
const GalleryManager = {
    init() {
        console.log('🖼️ GalleryManager initializing...');
        this.bindEvents();
        console.log('✅ GalleryManager initialized');
    },
    
    bindEvents() {
        $$('.gallery-item').forEach(item => {
            item.addEventListener('click', () => {
                const img = item.querySelector('img');
                const overlay = item.querySelector('.gallery-overlay');
                const title = overlay.querySelector('h4').textContent;
                
                this.showLightbox(img.src, title);
            });
        });
    },
    
    showLightbox(imageSrc, title) {
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            cursor: pointer;
            animation: fadeIn 0.3s ease;
        `;
        
        lightbox.innerHTML = `
            <button style="
                position: absolute;
                top: 2rem;
                right: 2rem;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                transition: all 0.3s ease;
            " onmouseover="this.style.background='rgba(255,255,255,0.3)'"
               onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                <i class="fas fa-times"></i>
            </button>
            <img src="${imageSrc}" alt="${title}" style="
                max-width: 90%;
                max-height: 80vh;
                border-radius: 1rem;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            ">
            <h3 style="
                color: white;
                margin-top: 2rem;
                font-size: 1.5rem;
            ">${title}</h3>
        `;
        
        document.body.appendChild(lightbox);
        document.body.style.overflow = 'hidden';
        
        // Close on click
        lightbox.addEventListener('click', () => {
            lightbox.style.opacity = '0';
            setTimeout(() => {
                lightbox.remove();
                document.body.style.overflow = '';
            }, 300);
        });
        
        // Close on ESC key
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                lightbox.click();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }
};

// Analytics & Tracking
// ==========================================
const AnalyticsManager = {
    init() {
        console.log('📊 AnalyticsManager initializing...');
        this.trackPageView();
        this.trackScrollDepth();
        this.trackTimeOnPage();
        console.log('✅ AnalyticsManager initialized');
    },
    
    trackPageView() {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                'page_title': 'Catering Services',
                'page_location': window.location.href,
                'page_path': window.location.pathname
            });
        }
        console.log('Page view tracked');
    },
    
    trackScrollDepth() {
        let maxScroll = 0;
        const milestones = [25, 50, 75, 100];
        const tracked = new Set();
        
        window.addEventListener('scroll', debounce(() => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );
            
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                
                milestones.forEach(milestone => {
                    if (scrollPercent >= milestone && !tracked.has(milestone)) {
                        tracked.add(milestone);
                        
                        if (typeof gtag !== 'undefined') {
                            gtag('event', 'scroll_depth', {
                                'event_category': 'Engagement',
                                'event_label': `${milestone}%`,
                                'value': milestone
                            });
                        }
                        console.log(`Scroll depth: ${milestone}%`);
                    }
                });
            }
        }, 500));
    },
    
    trackTimeOnPage() {
        const startTime = Date.now();
        
        window.addEventListener('beforeunload', () => {
            const timeSpent = Math.round((Date.now() - startTime) / 1000);
            
            if (typeof gtag !== 'undefined') {
                gtag('event', 'time_on_page', {
                    'event_category': 'Engagement',
                    'event_label': 'Catering Page',
                    'value': timeSpent
                });
            }
            console.log(`Time on page: ${timeSpent} seconds`);
        });
    }
};

// Auto-fill Detection (from URL or referrer)
// ==========================================
function checkAutoFill() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Pre-fill event type if specified
    const eventType = urlParams.get('event');
    if (eventType) {
        const eventTypeSelect = $('#eventType');
        if (eventTypeSelect) {
            eventTypeSelect.value = eventType;
            console.log('Auto-filled event type:', eventType);
        }
    }
    
    // Pre-fill guest count if specified
    const guests = urlParams.get('guests');
    if (guests) {
        const guestCountInput = $('#guestCount');
        if (guestCountInput) {
            guestCountInput.value = guests;
            console.log('Auto-filled guest count:', guests);
        }
    }
    
    // Scroll to form if 'quote=true' in URL
    if (urlParams.get('quote') === 'true') {
        setTimeout(() => {
            const quoteForm = $('#quote-form');
            if (quoteForm) {
                quoteForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 1000);
    }
}

// Initialize Everything
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('%c🍕 Catering Page Loaded', 'font-size: 20px; font-weight: bold; color: #F15A24;');
    
    try {
        FAQManager.init();
    } catch (e) {
        console.error('❌ FAQManager error:', e);
    }
    
    try {
        PackageManager.init();
    } catch (e) {
        console.error('❌ PackageManager error:', e);
    }
    
    try {
        QuoteFormManager.init();
    } catch (e) {
        console.error('❌ QuoteFormManager error:', e);
    }
    
    try {
        ScrollManager.init();
    } catch (e) {
        console.error('❌ ScrollManager error:', e);
    }
    
    try {
        GalleryManager.init();
    } catch (e) {
        console.error('❌ GalleryManager error:', e);
    }
    
    try {
        AnalyticsManager.init();
    } catch (e) {
        console.error('❌ AnalyticsManager error:', e);
    }
    
    // Check for auto-fill
    checkAutoFill();
    
    console.log('✅ All catering managers initialized');
    
    // Performance tracking
    if (window.performance) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`⚡ Page load time: ${pageLoadTime}ms`);
    }
});

// Keyboard Shortcuts
// ==========================================
document.addEventListener('keydown', (e) => {
    // Press 'Q' to scroll to quote form
    if (e.key === 'q' && !e.ctrlKey && !e.metaKey) {
        const activeElement = document.activeElement;
        if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
            const quoteForm = $('#quote-form');
            if (quoteForm) {
                quoteForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }
    
    // ESC to close lightbox (handled in GalleryManager)
});

// Export for debugging
// ==========================================
window.CateringApp = {
    FAQ: FAQManager,
    Package: PackageManager,
    QuoteForm: QuoteFormManager,
    Toast: Toast
};

console.log('💡 Tip: Access managers via window.CateringApp in console');
console.log('💡 Tip: Press "Q" to jump to quote form');