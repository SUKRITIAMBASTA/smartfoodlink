/* =====================================================
   SmartFoodLink — Landing Page Animations
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ─── Scroll-reveal with Intersection Observer ─────
    const reveals = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
    });

    reveals.forEach(el => observer.observe(el));

    // ─── Counter Animation ────────────────────────────
    const counters = document.querySelectorAll('[data-count]');

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(el => counterObserver.observe(el));

    function animateCounter(el) {
        const target = parseInt(el.dataset.count, 10);
        const duration = 2000;
        const start = Date.now();

        function tick() {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * target);

            el.textContent = current.toLocaleString() + (target >= 1000 ? '+' : '+');

            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        }

        tick();
    }

    // ─── Stagger reveal for grids ─────────────────────
    document.querySelectorAll('.steps-grid .reveal, .features-grid .reveal').forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.1}s`;
    });
});
