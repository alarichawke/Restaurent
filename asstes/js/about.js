// ==========================================
// ABOUT PAGE JAVASCRIPT - Chicago Pizza
// ==========================================
// Dependencies: main.js (provides $, $$, debounce utilities)

// Check if main.js utilities are available
if (typeof $ === 'undefined' || typeof $$ === 'undefined') {
    console.error('❌ Main.js utilities not found! Make sure main.js is loaded first.');
}

// Counter Animation Manager
// ==========================================
const CounterManager = {
    observers: [],
    
    init() {
        console.log('🔢 CounterManager initializing...');
        this.setupCounters();
        console.log('✅ CounterManager initialized');
    },
    
    setupCounters() {
        const counters = $$('.stat-number');
        
        if (!counters.length) return;
        
        // Create intersection observer for each counter
        counters.forEach(counter => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.5
            });
            
            observer.observe(counter);
            this.observers.push(observer);
        });
    },
    
    animateCounter(element) {
        const target = parseInt(element.dataset.target);
        const duration = 2000; // 2 seconds
        const increment = target / (duration / 16); // 60 FPS
        let current = 0;
        
        const updateCounter = () => {
            current += increment;
            
            if (current < target) {
                element.textContent = Math.floor(current).toLocaleString();
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target.toLocaleString();
            }
        };
        
        updateCounter();
        
        console.log(`Counter animated: ${target}`);
    }
};

// Scroll Animation Manager
// ==========================================
const ScrollAnimationManager = {
    observers: [],
    
    init() {
        console.log('📜 ScrollAnimationManager initializing...');
        this.setupAnimations();
        console.log('✅ ScrollAnimationManager initialized');
    },
    
    setupAnimations() {
        const animatedElements = $$('.value-card, .team-card, .award-card, .timeline-item');
        
        if (!animatedElements.length) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '0';
                    entry.target.style.transform = 'translateY(30px)';
                    
                    setTimeout(() => {
                        entry.target.style.transition = 'all 0.6s ease';
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, 100);
                    
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.2
        });
        
        animatedElements.forEach((element, index) => {
            element.style.transitionDelay = `${index * 0.1}s`;
            observer.observe(element);
        });
        
        this.observers.push(observer);
    }
};

// Timeline Manager
// ==========================================
const TimelineManager = {
    init() {
        console.log('⏱️ TimelineManager initializing...');
        this.setupTimeline();
        console.log('✅ TimelineManager initialized');
    },
    
    setupTimeline() {
        const timelineItems = $$('.timeline-item');
        
        if (!timelineItems.length) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Animate timeline year and content
                    const year = entry.target.querySelector('.timeline-year');
                    const content = entry.target.querySelector('.timeline-content');
                    
                    if (year) {
                        year.style.opacity = '0';
                        year.style.transform = 'translateX(-30px)';
                        
                        setTimeout(() => {
                            year.style.transition = 'all 0.6s ease';
                            year.style.opacity = '1';
                            year.style.transform = 'translateX(0)';
                        }, 100);
                    }
                    
                    if (content) {
                        content.style.opacity = '0';
                        content.style.transform = 'translateX(30px)';
                        
                        setTimeout(() => {
                            content.style.transition = 'all 0.6s ease';
                            content.style.opacity = '1';
                            content.style.transform = 'translateX(0)';
                        }, 300);
                    }
                    
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.3
        });
        
        timelineItems.forEach(item => {
            observer.observe(item);
        });
    }
};

// Team Card Manager
// ==========================================
const TeamCardManager = {
    init() {
        console.log('👥 TeamCardManager initializing...');
        this.bindEvents();
        console.log('✅ TeamCardManager initialized');
    },
    
    bindEvents() {
        const teamCards = $$('.team-card');
        
        teamCards.forEach(card => {
            // Add hover effects
            card.addEventListener('mouseenter', () => {
                this.onCardHover(card);
            });
            
            card.addEventListener('mouseleave', () => {
                this.onCardLeave(card);
            });
            
            // Track clicks on team cards
            card.addEventListener('click', () => {
                const name = card.querySelector('.team-info h3')?.textContent;
                console.log(`Team card clicked: ${name}`);
                
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'team_member_view', {
                        'event_category': 'Engagement',
                        'event_label': name
                    });
                }
            });
        });
    },
    
    onCardHover(card) {
        // Optional: Add custom hover effects
        const image = card.querySelector('.team-image img');
        if (image) {
            image.style.filter = 'brightness(1.1)';
        }
    },
    
    onCardLeave(card) {
        const image = card.querySelector('.team-image img');
        if (image) {
            image.style.filter = '';
        }
    }
};

// Video Modal Manager (for story video)
// ==========================================
const VideoModalManager = {
    modal: null,
    
    init() {
        console.log('🎥 VideoModalManager initializing...');
        this.createModal();
        this.bindEvents();
        console.log('✅ VideoModalManager initialized');
    },
    
    createModal() {
        // Create modal HTML
        const modal = document.createElement('div');
        modal.id = 'videoModal';
        modal.className = 'video-modal';
        modal.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: none;
            align-items: center;
            justify-content: center;
            padding: var(--space-6);
        `;
        
        modal.innerHTML = `
            <button class="video-modal-close" style="
                position: absolute;
                top: var(--space-6);
                right: var(--space-6);
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: none;
                font-size: var(--text-2xl);
                cursor: pointer;
                transition: all 0.3s ease;
            ">
                <i class="fas fa-times"></i>
            </button>
            <div class="video-container" style="
                max-width: 900px;
                width: 100%;
                aspect-ratio: 16/9;
                background: #000;
                border-radius: var(--radius-xl);
                overflow: hidden;
            ">
                <iframe width="100%" height="100%" 
                        src="" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                </iframe>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.modal = modal;
    },
    
    bindEvents() {
        // Story overlay click
        const storyOverlay = $('.story-overlay');
        if (storyOverlay) {
            storyOverlay.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal();
            });
        }
        
        // Close button
        const closeBtn = this.modal.querySelector('.video-modal-close');
        closeBtn.addEventListener('click', () => this.closeModal());
        
        // Close on overlay click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'flex') {
                this.closeModal();
            }
        });
    },
    
    openModal() {
        // Replace with actual video URL
        const videoUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1';
        const iframe = this.modal.querySelector('iframe');
        
        iframe.src = videoUrl;
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        console.log('Video modal opened');
        
        if (typeof gtag !== 'undefined') {
            gtag('event', 'video_play', {
                'event_category': 'Engagement',
                'event_label': 'Our Story Video'
            });
        }
    },
    
    closeModal() {
        const iframe = this.modal.querySelector('iframe');
        iframe.src = '';
        
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
        
        console.log('Video modal closed');
    }
};

// Parallax Effect Manager
// ==========================================
const ParallaxManager = {
    init() {
        console.log('🎨 ParallaxManager initializing...');
        this.setupParallax();
        console.log('✅ ParallaxManager initialized');
    },
    
    setupParallax() {
        window.addEventListener('scroll', debounce(() => {
            this.updateParallax();
        }, 10));
    },
    
    updateParallax() {
        const scrolled = window.pageYOffset;
        
        // Hero parallax
        const heroBg = $('.about-hero__bg');
        if (heroBg) {
            heroBg.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
        
        // Story images parallax
        const storyImageMain = $('.story-image-main');
        if (storyImageMain && this.isInViewport(storyImageMain)) {
            const rect = storyImageMain.getBoundingClientRect();
            const offset = (window.innerHeight - rect.top) * 0.05;
            storyImageMain.style.transform = `translateY(${offset}px)`;
        }
    },
    
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top < window.innerHeight &&
            rect.bottom > 0
        );
    }
};

// Awards Hover Effect Manager
// ==========================================
const AwardsManager = {
    init() {
        console.log('🏆 AwardsManager initializing...');
        this.bindEvents();
        console.log('✅ AwardsManager initialized');
    },
    
    bindEvents() {
        const awardCards = $$('.award-card');
        
        awardCards.forEach(card => {
            card.addEventListener('click', () => {
                const awardName = card.querySelector('h4')?.textContent;
                console.log(`Award clicked: ${awardName}`);
                
                // Show award details (optional enhancement)
                this.showAwardDetails(card);
            });
        });
    },
    
    showAwardDetails(card) {
        const title = card.querySelector('h4')?.textContent;
        const organization = card.querySelector('p')?.textContent;
        const year = card.querySelector('.award-year')?.textContent;
        
        // Simple alert - you can replace with a modal
        alert(`🏆 ${title}\n\nAwarded by: ${organization}\nYear: ${year}\n\nClick OK to continue.`);
        
        if (typeof gtag !== 'undefined') {
            gtag('event', 'award_view', {
                'event_category': 'Engagement',
                'event_label': title
            });
        }
    }
};

// Smooth Scroll Manager
// ==========================================
const SmoothScrollManager = {
    init() {
        console.log('📜 SmoothScrollManager initializing...');
        this.bindEvents();
        console.log('✅ SmoothScrollManager initialized');
    },
    
    bindEvents() {
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

// Progress Bar Manager (optional)
// ==========================================
const ProgressBarManager = {
    progressBar: null,
    
    init() {
        console.log('📊 ProgressBarManager initializing...');
        this.createProgressBar();
        this.bindEvents();
        console.log('✅ ProgressBarManager initialized');
    },
    
    createProgressBar() {
        const bar = document.createElement('div');
        bar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 0%;
            height: 3px;
            background: linear-gradient(90deg, var(--primary-orange) 0%, var(--primary-orange-light) 100%);
            z-index: 10001;
            transition: width 0.1s ease;
        `;
        
        document.body.appendChild(bar);
        this.progressBar = bar;
    },
    
    bindEvents() {
        window.addEventListener('scroll', () => {
            this.updateProgress();
        });
    },
    
    updateProgress() {
        const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = (window.pageYOffset / windowHeight) * 100;
        
        this.progressBar.style.width = `${scrolled}%`;
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
        this.trackSectionViews();
        console.log('✅ AnalyticsManager initialized');
    },
    
    trackPageView() {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                'page_title': 'About Us',
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
                    'event_label': 'About Page',
                    'value': timeSpent
                });
            }
            console.log(`Time on page: ${timeSpent} seconds`);
        });
    },
    
    trackSectionViews() {
        const sections = $$('section[class*="section"]');
        const tracked = new Set();
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !tracked.has(entry.target)) {
                    tracked.add(entry.target);
                    const sectionName = entry.target.className.split(' ')[0];
                    
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'section_view', {
                            'event_category': 'Engagement',
                            'event_label': sectionName
                        });
                    }
                    console.log(`Section viewed: ${sectionName}`);
                }
            });
        }, {
            threshold: 0.5
        });
        
        sections.forEach(section => observer.observe(section));
    }
};

// Easter Egg Manager (Fun feature)
// ==========================================
const EasterEggManager = {
    konamiCode: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'],
    userInput: [],
    
    init() {
        console.log('🥚 EasterEggManager initializing...');
        this.bindEvents();
        console.log('✅ EasterEggManager initialized');
    },
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            this.userInput.push(e.key);
            
            if (this.userInput.length > this.konamiCode.length) {
                this.userInput.shift();
            }
            
            if (this.userInput.join(',') === this.konamiCode.join(',')) {
                this.activateEasterEgg();
                this.userInput = [];
            }
        });
        
        // Double click on logo
        const logo = $('.nav__logo');
        if (logo) {
            logo.addEventListener('dblclick', () => {
                this.showSecretMessage();
            });
        }
    },
    
    activateEasterEgg() {
        console.log('🎉 Easter egg activated!');
        
        // Rotate all pizza emojis
        document.body.style.filter = 'hue-rotate(180deg)';
        
        setTimeout(() => {
            document.body.style.filter = '';
            alert('🍕 You found the secret! Enjoy 10% off with code: PIZZALOVER10');
        }, 1000);
    },
    
    showSecretMessage() {
        console.log('🤫 Secret message revealed!');
        alert('🍕 Fun fact: We make over 200 pizzas every day!\n\nThanks for exploring our story! 🎉');
    }
};

// Image Lazy Loading Enhancement
// ==========================================
const ImageLoaderManager = {
    init() {
        console.log('🖼️ ImageLoaderManager initializing...');
        
        if ('loading' in HTMLImageElement.prototype) {
            console.log('Native lazy loading supported');
        } else {
            this.setupFallback();
        }
        
        console.log('✅ ImageLoaderManager initialized');
    },
    
    setupFallback() {
        const images = $$('img[loading="lazy"]');
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
};

// Initialize Everything
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('%c🏢 About Page Loaded', 'font-size: 20px; font-weight: bold; color: #F15A24;');
    
    try {
        CounterManager.init();
    } catch (e) {
        console.error('❌ CounterManager error:', e);
    }
    
    try {
        ScrollAnimationManager.init();
    } catch (e) {
        console.error('❌ ScrollAnimationManager error:', e);
    }
    
    try {
        TimelineManager.init();
    } catch (e) {
        console.error('❌ TimelineManager error:', e);
    }
    
    try {
        TeamCardManager.init();
    } catch (e) {
        console.error('❌ TeamCardManager error:', e);
    }
    
    try {
        VideoModalManager.init();
    } catch (e) {
        console.error('❌ VideoModalManager error:', e);
    }
    
    try {
        ParallaxManager.init();
    } catch (e) {
        console.error('❌ ParallaxManager error:', e);
    }
    
    try {
        AwardsManager.init();
    } catch (e) {
        console.error('❌ AwardsManager error:', e);
    }
    
    try {
        SmoothScrollManager.init();
    } catch (e) {
        console.error('❌ SmoothScrollManager error:', e);
    }
    
    try {
        ProgressBarManager.init();
    } catch (e) {
        console.error('❌ ProgressBarManager error:', e);
    }
    
    try {
        AnalyticsManager.init();
    } catch (e) {
        console.error('❌ AnalyticsManager error:', e);
    }
    
    try {
        EasterEggManager.init();
    } catch (e) {
        console.error('❌ EasterEggManager error:', e);
    }
    
    try {
        ImageLoaderManager.init();
    } catch (e) {
        console.error('❌ ImageLoaderManager error:', e);
    }
    
    console.log('✅ All about page managers initialized');
    
    // Performance tracking
    if (window.performance) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`⚡ Page load time: ${pageLoadTime}ms`);
    }
});

// Export for debugging
// ==========================================
window.AboutApp = {
    Counter: CounterManager,
    Timeline: TimelineManager,
    Team: TeamCardManager,
    Video: VideoModalManager,
    Analytics: AnalyticsManager
};

console.log('💡 Tip: Access about page managers via window.AboutApp in console');
console.log('💡 Easter Egg: Try the Konami Code! ⬆⬆⬇⬇⬅➡⬅➡BA');
console.log('💡 Or double-click the logo for a surprise! 🍕');