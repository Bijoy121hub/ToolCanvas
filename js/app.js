// Tools Data
const tools = [
    { id: 'birthday', name: 'Birthday Calculator', icon: '🎂', href: 'birthday.html' },
    { id: 'converter', name: 'PDF Converter', icon: '📄', href: 'converter.html' },
    { id: 'resizer', name: 'Image Resizer', icon: '🖼️', href: 'resizer.html' },
    { id: 'calculator', name: 'Calculator', icon: '💰', href: 'calculator.html' },
    { id: 'units', name: 'Unit Converter', icon: '🔄', href: 'units.html' },
    { id: 'qrcode', name: 'QR Code', icon: '📱', href: 'qrcode.html' },
    { id: 'password', name: 'Password Generator', icon: '🔐', href: 'password.html' }
];

document.addEventListener('DOMContentLoaded', () => {
    initTiltEffect();
    initScrollReveal();
    initSmoothScroll();
});

// 3D Tilt Effect
function initTiltEffect() {
    if (!window.matchMedia("(hover: hover)").matches) return;

    const cards = document.querySelectorAll('.tilt-card');
    
    cards.forEach(card => {
        let requestId = null;

        card.addEventListener('mousemove', (e) => {
            if (requestId) cancelAnimationFrame(requestId);
            
            requestId = requestAnimationFrame(() => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = ((y - centerY) / centerY) * -15; // Max -15 to 15 deg
                const rotateY = ((x - centerX) / centerX) * 15; // Max -15 to 15 deg
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            });
        });

        card.addEventListener('mouseleave', () => {
            if (requestId) cancelAnimationFrame(requestId);
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            card.style.transition = 'transform 0.5s ease-out';
            
            // Remove transition after it completes to not interfere with mousemove
            setTimeout(() => {
                card.style.transition = '';
            }, 500);
        });
    });
}

// Scroll Reveal
function initScrollReveal() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((el, index) => {
        el.style.transitionDelay = `${(index % 10) * 100}ms`;
        observer.observe(el);
    });
}

// Smooth Scroll
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Navigation Helpers (for tool pages)
function createToolNav(currentToolId) {
    const navContainer = document.createElement('nav');
    navContainer.className = 'tool-nav';
    
    const currentTool = tools.find(t => t.id === currentToolId);
    
    let html = `
        <div class="nav-brand">
            <a href="../index.html" class="back-home" title="Back to Home">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            </a>
            <span class="nav-title">${currentTool ? currentTool.icon + ' ' + currentTool.name : 'ToolCanvas'}</span>
        </div>
        <div class="nav-links">
    `;
    
    tools.forEach(tool => {
        const isActive = tool.id === currentToolId ? 'active' : '';
        html += `<a href="${tool.href}" class="tool-link ${isActive}" title="${tool.name}">${tool.icon}</a>`;
    });
    
    html += `</div>`;
    navContainer.innerHTML = html;
    
    // Prepend to body or a specific header container
    const headerElement = document.querySelector('header');
    if (headerElement) {
        headerElement.appendChild(navContainer);
    } else {
        document.body.insertBefore(navContainer, document.body.firstChild);
    }
}

// Utility Functions

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showToast('Failed to copy text', 'error');
    });
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadDataURL(dataURL, filename) {
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

// Toast Notification System
let toastContainer = null;

function createToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
}

function showToast(message, type = 'info') {
    createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '';
    switch(type) {
        case 'success': icon = '✅ '; break;
        case 'error': icon = '❌ '; break;
        case 'info': icon = 'ℹ️ '; break;
    }
    
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-message">${message}</span>`;
    
    toastContainer.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if(toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300); // match transition duration
    }, 3000);
}
