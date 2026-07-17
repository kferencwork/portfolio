document.addEventListener('DOMContentLoaded', () => {
    const pages = {
        fooldal: document.getElementById('page-fooldal'),
        plc: document.getElementById('page-plc'),
        robotika: document.getElementById('page-robotika'),
        vizsga: document.getElementById('page-vizsga')
    };

    let currentPage = 'fooldal';

    // Parse hash on load
    function getHash() {
        let h = window.location.hash.substring(1);
        if (!pages[h]) {
            h = 'fooldal';
            history.replaceState(null, null, '#fooldal');
        }
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

    // --- Custom Video Player Logic ---
    const players = document.querySelectorAll('.custom-player');
    
    players.forEach(player => {
        const video = player.querySelector('video');
        const centerPlayBtn = player.querySelector('.video-center-play');
        const playPauseBtn = player.querySelector('.play-pause-btn');
        const iconPlay = player.querySelector('.icon-play');
        const iconPause = player.querySelector('.icon-pause');
        const progressBar = player.querySelector('.progress-bar');
        const progressFilled = player.querySelector('.progress-filled');
        const currentTimeEl = player.querySelector('.current-time');
        const totalTimeEl = player.querySelector('.total-time');
        const volumeBtn = player.querySelector('.volume-btn');
        const iconVolHigh = player.querySelector('.icon-volume-high');
        const iconVolMuted = player.querySelector('.icon-volume-muted');
        const volumeSlider = player.querySelector('.volume-slider');
        const fullscreenBtn = player.querySelector('.fullscreen-btn');
        const iconFullscreen = player.querySelector('.icon-fullscreen');
        const iconFullscreenExit = player.querySelector('.icon-fullscreen-exit');
        const controls = player.querySelector('.video-controls');

        let hideControlsTimeout;

        function formatTime(seconds) {
            if (isNaN(seconds)) return "0:00";
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
        }

        function togglePlay() {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        }

        video.addEventListener('play', () => {
            player.classList.add('is-playing');
            player.classList.remove('is-paused');
            iconPlay.style.display = 'none';
            iconPause.style.display = 'block';
            resetControlsTimeout();
        });

        video.addEventListener('pause', () => {
            player.classList.remove('is-playing');
            player.classList.add('is-paused');
            iconPlay.style.display = 'block';
            iconPause.style.display = 'none';
            controls.style.opacity = '1';
            player.style.cursor = 'default';
            clearTimeout(hideControlsTimeout);
        });

        centerPlayBtn.addEventListener('click', togglePlay);
        playPauseBtn.addEventListener('click', togglePlay);
        video.addEventListener('click', togglePlay);

        function updateTotalTime() {
            if (video.duration && !isNaN(video.duration)) {
                totalTimeEl.textContent = formatTime(video.duration);
            }
        }

        video.addEventListener('loadedmetadata', updateTotalTime);
        
        // If the browser already loaded the video metadata before JS executed
        if (video.readyState >= 1) { 
            updateTotalTime();
        }

        video.addEventListener('timeupdate', () => {
            currentTimeEl.textContent = formatTime(video.currentTime);
            // Also update total time here just in case metadata was delayed
            if (totalTimeEl.textContent === '0:00' && video.duration) {
                updateTotalTime();
            }
            const progressPercent = (video.currentTime / video.duration) * 100;
            progressBar.value = progressPercent || 0;
            progressFilled.style.width = `${progressPercent || 0}%`;
        });

        progressBar.addEventListener('input', (e) => {
            const scrubTime = (e.target.value / 100) * video.duration;
            video.currentTime = scrubTime;
            progressFilled.style.width = `${e.target.value}%`;
        });

        let lastVolume = 1;
        const volumeSliderContainer = player.querySelector('.volume-slider-container');
        const volTooltip = player.querySelector('.volume-tooltip');
        const progressHover = player.querySelector('.progress-hover');
        const progTooltip = player.querySelector('.progress-tooltip');

        const volumeHover = player.querySelector('.volume-hover');
        const volumeFilled = player.querySelector('.volume-filled');

        // Timeline Hover Preview
        progressBar.addEventListener('mousemove', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            if (progressHover) progressHover.style.width = `${pos * 100}%`;
            if (progTooltip) {
                progTooltip.textContent = formatTime(pos * video.duration);
                progTooltip.style.left = `${pos * 100}%`;
            }
        });
        progressBar.addEventListener('mouseleave', () => {
            if (progressHover) progressHover.style.width = '0%';
        });

        // Volume Toggle & Memory
        function toggleMute() {
            if (video.muted || video.volume === 0) {
                // Unmute
                video.muted = false;
                video.volume = lastVolume > 0 ? lastVolume : 1; 
                volumeSlider.value = video.volume;
            } else {
                // Mute
                lastVolume = video.volume;
                video.muted = true;
                volumeSlider.value = 0;
            }
            updateVolumeIcon();
        }

        function updateVolumeIcon() {
            const currentVol = video.muted ? 0 : video.volume;
            
            // Update white filled bar
            if (volumeFilled) {
                volumeFilled.style.width = `${currentVol * 100}%`;
            }
            
            if (currentVol === 0) {
                iconVolHigh.style.display = 'none';
                iconVolMuted.style.display = 'block';
            } else {
                iconVolHigh.style.display = 'block';
                iconVolMuted.style.display = 'none';
            }
        }

        volumeBtn.addEventListener('click', toggleMute);

        volumeSlider.addEventListener('input', (e) => {
            video.volume = e.target.value;
            video.muted = e.target.value == 0;
            updateVolumeIcon();
        });

        // Initialize volume UI on load
        updateVolumeIcon();

        // Volume Hover Preview
        volumeSlider.addEventListener('mousemove', (e) => {
            const rect = volumeSlider.getBoundingClientRect();
            const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            if (volumeHover) volumeHover.style.width = `${pos * 100}%`;
            if (volTooltip) {
                const percent = pos * 100;
                volTooltip.textContent = `${Math.round(percent)}%`;
                volTooltip.style.left = `${percent}%`;
            }
        });
        volumeSlider.addEventListener('mouseleave', () => {
            if (volumeHover) volumeHover.style.width = '0%';
        });

        // "Theater Mode" In-page Fullscreen
        const spaPage = player.closest('.spa-page');
        function toggleFullscreen() {
            if (spaPage) {
                spaPage.classList.toggle('is-fullscreen');
                document.body.classList.toggle('fullscreen-active');
                
                const isFull = spaPage.classList.contains('is-fullscreen');
                if (isFull) {
                    iconFullscreen.style.display = 'none';
                    iconFullscreenExit.style.display = 'block';
                } else {
                    iconFullscreen.style.display = 'block';
                    iconFullscreenExit.style.display = 'none';
                }
                
                // Allow time for CSS transition before layout changes
                setTimeout(() => {
                    // Trigger a resize event to help video adjust if needed
                    window.dispatchEvent(new Event('resize'));
                }, 400);
            }
        }

        fullscreenBtn.addEventListener('click', toggleFullscreen);

        // Escape to exit fullscreen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && spaPage && spaPage.classList.contains('is-fullscreen')) {
                toggleFullscreen();
            }
        });

        function resetControlsTimeout() {
            player.style.cursor = 'default';
            controls.style.opacity = '1';
            
            clearTimeout(hideControlsTimeout);
            if (!video.paused) {
                hideControlsTimeout = setTimeout(() => {
                    player.style.cursor = 'none';
                    controls.style.opacity = '0';
                }, 2500);
            }
        }

        player.addEventListener('mousemove', resetControlsTimeout);
        player.addEventListener('mouseleave', () => {
            if (!video.paused) {
                controls.style.opacity = '0';
            }
        });
    });
});
