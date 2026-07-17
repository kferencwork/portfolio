document.addEventListener('DOMContentLoaded', () => {
    const pages = {
        index: document.getElementById('page-index'),
        plc: document.getElementById('page-plc'),
        robotika: document.getElementById('page-robotika'),
        vizsga: document.getElementById('page-vizsga')
    };

    let currentPage = 'index';

    // Parse hash on load
    function getHash() {
        let h = window.location.hash.substring(1);
        if (!pages[h]) h = 'index';
        return h;
    }

    // Set initial page without animation
    currentPage = getHash();
    Object.keys(pages).forEach(key => {
        if (pages[key]) {
            pages[key].style.display = key === currentPage ? 'flex' : 'none';
        }
    });

    // Fade in initially
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 50);

    // Stop native anchor jump behavior and handle internally
    window.addEventListener('hashchange', (e) => {
        const targetPage = getHash();
        if (targetPage === currentPage) return; // Prevent double trigger

        // Fade out
        document.body.classList.remove('loaded');

        // Pause video immediately so audio stops, but don't reset time yet (so user doesn't see it jump)
        if (pages[currentPage]) {
            pages[currentPage].querySelectorAll('video').forEach(vid => {
                vid.pause();
            });
        }

        setTimeout(() => {
            // ... (fade out logic unchanged) ...
            if (pages[currentPage]) {
                pages[currentPage].querySelectorAll('video').forEach(vid => {
                    vid.currentTime = 0;
                });
                
                pages[currentPage].style.display = 'none';
            }

            pages[targetPage].style.display = 'flex';
            
            if (pages[targetPage]) {
                const iframes = pages[targetPage].querySelectorAll('iframe');
                iframes.forEach(iframe => {
                    let src = iframe.getAttribute('src');
                    if (!src.includes('page=1')) {
                        src = src.replace('#', '#page=1&');
                    }
                    const clone = iframe.cloneNode(true);
                    clone.src = src;
                    iframe.parentNode.replaceChild(clone, iframe);
                });
            }

            currentPage = targetPage;
            document.body.classList.add('loaded');
        }, 500);
    });

    // Custom Cursor Logic - Optimized for 0 lag
    const customCursor = document.getElementById('custom-cursor');
    const cards = document.querySelectorAll('.card');
    
    if (customCursor) {
        let cursorX = 0;
        let cursorY = 0;
        let isCursorVisible = false;
        let animationFrameId = null;

        const updateCursor = () => {
            if (isCursorVisible && window.innerWidth > 1024) {
                // Offset: centered but shifted 10px right, positioned closer (8px above)
                customCursor.style.transform = `translate(calc(${cursorX + 10}px - 50%), calc(${cursorY - 8}px - 100%))`;
            }
            animationFrameId = requestAnimationFrame(updateCursor);
        };

        cards.forEach(card => {
            card.addEventListener('mouseenter', (e) => {
                if (window.innerWidth > 1024) {
                    cursorX = e.clientX;
                    cursorY = e.clientY;
                    customCursor.style.opacity = '1';
                    isCursorVisible = true;
                    
                    // Start render loop if not running
                    if (!animationFrameId) {
                        animationFrameId = requestAnimationFrame(updateCursor);
                    }
                    // Instant first frame update to avoid jump
                    customCursor.style.transform = `translate(calc(${cursorX + 10}px - 50%), calc(${cursorY - 8}px - 100%))`;
                }
            });

            card.addEventListener('mousemove', (e) => {
                cursorX = e.clientX;
                cursorY = e.clientY;
            });
            
            card.addEventListener('mouseleave', () => {
                customCursor.style.opacity = '0';
                isCursorVisible = false;
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
            });
        });
    }
});
