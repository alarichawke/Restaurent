const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const header = $('#header');
let lastScroll = 0;

window.addEventListener('scroll', debounce(() => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
    
    if (currentScroll > lastScroll && currentScroll > 200) {
        header.style.transform = 'translateY(-100%)';
    } else {
        header.style.transform = 'translateY(0)';
    }
    
    lastScroll = currentScroll;
}, 100));

const navToggle = $('#navToggle');
const navMenu = $('#navMenu');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        const isExpanded = navMenu.classList.contains('active');
        navToggle.setAttribute('aria-expanded', isExpanded);
        
        const icon = navToggle.querySelector('i');
        if (isExpanded) {
            icon.classList.replace('fa-bars', 'fa-times');
        } else {
            icon.classList.replace('fa-times', 'fa-bars');
        }
    });
    
    navMenu.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
            navToggle.querySelector('i').classList.replace('fa-times', 'fa-bars');
        });
    });
}

$$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = $(href);
        
        if (target) {
            const headerHeight = header.offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

const locationTabs = $$('.location-tab');
const locationDetails = $$('.location-details');

locationTabs.forEach(tab => {
    tab.addEventListener('click', () => {

        locationTabs.forEach(t => t.classList.remove('active'));
        locationDetails.forEach(d => d.classList.remove('active'));

        tab.classList.add('active');
        const targetLocation = tab.dataset.location;
        $(`#${targetLocation}`).classList.add('active');
    });
});

const categoryBtns = $$('.category-btn');
const menuCards = $$('.menu-card');

categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const category = btn.dataset.category;
        
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        menuCards.forEach(card => {
            const cardCategories = card.dataset.category || '';
            
            if (category === 'all' || cardCategories.includes(category)) {
                card.style.display = '';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 10);
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });
    });
});

const detectLocationBtn = $('#detectLocationBtn');

if (detectLocationBtn) {
    detectLocationBtn.addEventListener('click', () => {
        if ('geolocation' in navigator) {
            detectLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting...';
            detectLocationBtn.disabled = true;
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    console.log('Location:', latitude, longitude);
                    
                    setTimeout(() => {
                        detectLocationBtn.innerHTML = '<i class="fas fa-check-circle"></i> Location Found!';
                        detectLocationBtn.style.background = 'var(--basil-green)';
                        detectLocationBtn.style.borderColor = 'var(--basil-green)';
                        
                        setTimeout(() => {
                            detectLocationBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i> Use My Location';
                            detectLocationBtn.style.background = '';
                            detectLocationBtn.style.borderColor = '';
                            detectLocationBtn.disabled = false;
                        }, 2000);
                    }, 1500);
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    detectLocationBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Location Denied';
                    detectLocationBtn.style.background = 'var(--tomato-red)';
                    
                    setTimeout(() => {
                        detectLocationBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i> Use My Location';
                        detectLocationBtn.style.background = '';
                        detectLocationBtn.disabled = false;
                    }, 2000);
                }
            );
        } else {
            alert('Geolocation is not supported by your browser');
        }
    });
}

const cart = {
    items: [],
    total: 0,
    
    add(item) {
        this.items.push(item);
        this.updateTotal();
        this.updateUI();
        this.showCartBar();
    },
    
    updateTotal() {
        this.total = this.items.reduce((sum, item) => sum + item.price, 0);
    },
    
    updateUI() {
        const cartCount = $('.cart-count');
        const cartTotal = $('.cart-total');
        
        if (cartCount) cartCount.textContent = this.items.length;
        if (cartTotal) cartTotal.textContent = `$${this.total.toFixed(2)}`;
    },
    
    showCartBar() {
        const cartBar = $('#stickyCartBar');
        if (cartBar && window.innerWidth <= 768) {
            cartBar.classList.add('show');
        }
    }
};

$$('[data-pizza]').forEach(btn => {
    btn.addEventListener('click', () => {
        const pizzaName = btn.dataset.pizza;
        const card = btn.closest('.menu-card');
        const price = parseFloat(card.querySelector('.price strong').textContent.replace('$', ''));
        
        cart.add({
            name: pizzaName,
            price: price
        });
        
        btn.innerHTML = '<i class="fas fa-check"></i> Added!';
        btn.style.background = 'var(--basil-green)';
        
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-plus"></i> Add to Cart';
            btn.style.background = '';
        }, 1500);
        
        if (typeof gtag !== 'undefined') {
            gtag('event', 'add_to_cart', {
                'event_category': 'Ecommerce',
                'event_label': pizzaName,
                'value': price
            });
        }
    });
});

const modals = $$('.modal');

function openModal(modalId) {
    const modal = $(`#${modalId}`);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        firstElement.focus();
        
        modal.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
            
            if (e.key === 'Escape') {
                closeModal(modalId);
            }
        });
    }
}

function closeModal(modalId) {
    const modal = $(`#${modalId}`);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

$$('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        if (modal) {
            closeModal(modal.id);
        }
    });
});
// Order buttons - Navigate to menu page
// Order buttons - Navigate to menu page and flag to open cart
const orderButtons = $$('#startOrderBtn, #orderNowHero');
orderButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        console.log('📍 Order button clicked - setting cart flag');
        
        // Set flag in sessionStorage
        sessionStorage.setItem('autoOpenCart', 'true');
        
        // Track analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'begin_checkout', {
                'event_category': 'Ecommerce',
                'event_label': 'Order Now Button'
            });
        }
        
        // Allow navigation
    });
});

$$('#startOrderBtn, #orderNowHero').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Track the event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'begin_checkout', {
                'event_category': 'Ecommerce'
            });
        }
        
        console.log('Order Now clicked - navigating to menu.html');
        // Let the default <a> tag behavior work (navigation)
    });
});

const newsletterForm = $('#newsletterForm');

if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = newsletterForm.querySelector('input[type="email"]');
        const email = emailInput.value;
        
        const submitBtn = newsletterForm.querySelector('button');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            submitBtn.innerHTML = '<i class="fas fa-check"></i>';
            submitBtn.style.background = 'var(--basil-green)';
            emailInput.value = '';
            
            setTimeout(() => {
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
                submitBtn.style.background = '';
                submitBtn.disabled = false;
            }, 2000);
            
            if (typeof gtag !== 'undefined') {
                gtag('event', 'newsletter_signup', {
                    'event_category': 'Engagement',
                    'event_label': email
                });
            }
        }, 1500);
    });
}

if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                observer.unobserve(img);
            }
        });
    });
    
    $$('img[data-src]').forEach(img => imageObserver.observe(img));
}

$$('.size-option input').forEach(input => {
    input.addEventListener('keydown', (e) => {
        const current = e.target.parentElement;
        const options = Array.from($$('.size-option'));
        const currentIndex = options.indexOf(current);
        
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % options.length;
            options[nextIndex].querySelector('input').focus();
            options[nextIndex].querySelector('input').checked = true;
        }
        
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = (currentIndex - 1 + options.length) % options.length;
            options[prevIndex].querySelector('input').focus();
            options[prevIndex].querySelector('input').checked = true;
        }
    });
});

if ('PerformanceObserver' in window) {

    const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    let clsValue = 0; 
    const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
                clsValue += entry.value;
            }
        }
        console.log('CLS:', clsValue);
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
}

function trackEvent(eventName, eventData = {}) {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, eventData);
    }
    console.log('Event:', eventName, eventData);
}
if ('IntersectionObserver' in window) {
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                const pizzaName = card.querySelector('.card-title').textContent;
                trackEvent('view_item', {
                    'event_category': 'Menu',
                    'event_label': pizzaName
                });
                cardObserver.unobserve(card);
            }
        });
    }, { threshold: 0.5 });
    
    $$('.menu-card').forEach(card => cardObserver.observe(card));
}

$$('.btn-primary, .btn-secondary, .btn-outline').forEach(btn => {
    btn.addEventListener('click', () => {
        const btnText = btn.textContent.trim();
        trackEvent('cta_click', {
            'event_category': 'Engagement',
            'event_label': btnText
        });
    });
});

console.log('%c🍕 Chicago Premium Pizza', 'font-size: 24px; font-weight: bold; color: #F15A24;');
console.log('%cLooking for a job? We\'re hiring developers! Email: careers@chicagopizza.com', 'font-size: 14px; color: #555;');

window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    console.log('Page fully loaded');
    if (window.performance) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        trackEvent('page_load', {
            'event_category': 'Performance',
            'value': pageLoadTime
        });
    }
});

// Service Worker - Only enable in production
if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    window.addEventListener('load', () => {
        // Check if sw.js exists first
        fetch('/sw.js', { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    navigator.serviceWorker.register('/sw.js')
                        .then(reg => console.log('✅ Service Worker registered'))
                        .catch(err => console.log('❌ Service Worker registration failed:', err));
                }
            })
            .catch(() => {
                console.log('ℹ️ Service Worker file not found - skipping registration');
            });
    });
}

