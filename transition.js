document.addEventListener('DOMContentLoaded', () => {
    const pages = {
        fooldal: document.getElementById('page-fooldal'),
        plc: document.getElementById('page-plc'),
        robotika: document.getElementById('page-robotika')
    };

    const pageKeys = Object.keys(pages).filter(key => pages[key]);
    const cards = document.querySelectorAll('.card');
    let currentPage = getHash();
    let isTransitioning = false;

    function getHash() {
        const requestedPage = window.location.hash.substring(1);

        if (pageKeys.includes(requestedPage)) {
            return requestedPage;
        }

        history.replaceState(null, '', '#fooldal');
        return 'fooldal';
    }

    function setPageVisibility(activePage) {
        pageKeys.forEach(key => {
            pages[key].style.display = key === activePage ? 'flex' : 'none';
        });
    }

    function loadPageAssets(page) {
        if (!page) return;

        page.querySelectorAll('iframe[data-src]').forEach(iframe => {
            if (!iframe.src) {
                iframe.src = iframe.dataset.src;
            }
        });
    }

    function exitTheaterMode(page) {
        if (!page || !page.classList.contains('is-fullscreen')) return;

        page.classList.remove('is-fullscreen');
        document.body.classList.toggle('fullscreen-active', Boolean(document.querySelector('.spa-page.is-fullscreen')));

        const player = page.querySelector('.custom-player');
        if (player && player.videoControlsApi) {
            player.videoControlsApi.syncFullscreenButton();
        }
    }

    function pauseAndResetVideos(page) {
        if (!page) return;

        page.querySelectorAll('video').forEach(video => {
            video.pause();

            if (Number.isFinite(video.duration)) {
                video.currentTime = 0;
            }
        });
    }

    function clearCardState() {
        cards.forEach(card => card.classList.remove('is-active'));
    }

    function switchPage(targetPage) {
        if (isTransitioning || targetPage === currentPage || !pages[targetPage]) return;

        isTransitioning = true;
        document.body.style.pointerEvents = 'none';
        document.body.classList.remove('loaded');

        const previousPage = pages[currentPage];
        pauseAndResetVideos(previousPage);
        exitTheaterMode(previousPage);

        window.setTimeout(() => {
            if (previousPage) {
                previousPage.style.display = 'none';
            }

            const nextPage = pages[targetPage];
            nextPage.style.display = 'flex';
            loadPageAssets(nextPage);

            currentPage = targetPage;
            document.body.classList.add('loaded');
            document.body.style.pointerEvents = '';
            isTransitioning = false;
            clearCardState();
        }, 500);
    }

    setPageVisibility(currentPage);
    loadPageAssets(pages[currentPage]);

    window.setTimeout(() => {
        document.body.classList.add('loaded');
    }, 50);

    window.addEventListener('hashchange', () => {
        switchPage(getHash());
    });

    initCustomCursor();
    initVideoPlayers();

    function initCustomCursor() {
        const customCursor = document.getElementById('custom-cursor');
        if (!customCursor) return;

        let cursorX = 0;
        let cursorY = 0;
        let isCursorVisible = false;
        let animationFrameId = null;

        const updateCursor = () => {
            if (isCursorVisible && window.innerWidth > 1024) {
                customCursor.style.transform = `translate(calc(${cursorX + 10}px - 50%), calc(${cursorY - 8}px - 100%))`;
            }

            animationFrameId = window.requestAnimationFrame(updateCursor);
        };

        const stopCursorLoop = () => {
            customCursor.style.opacity = '0';
            isCursorVisible = false;

            if (animationFrameId) {
                window.cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        };

        cards.forEach(card => {
            card.addEventListener('mouseenter', event => {
                if (window.innerWidth <= 1024) return;

                cursorX = event.clientX;
                cursorY = event.clientY;
                customCursor.style.opacity = '1';
                isCursorVisible = true;
                customCursor.style.transform = `translate(calc(${cursorX + 10}px - 50%), calc(${cursorY - 8}px - 100%))`;

                if (!animationFrameId) {
                    animationFrameId = window.requestAnimationFrame(updateCursor);
                }
            });

            card.addEventListener('mousemove', event => {
                cursorX = event.clientX;
                cursorY = event.clientY;
            });

            card.addEventListener('mouseleave', stopCursorLoop);

            card.addEventListener('click', () => {
                card.classList.add('is-active');
                stopCursorLoop();
            });
        });
    }

    function initVideoPlayers() {
        const players = document.querySelectorAll('.custom-player');

        players.forEach(player => {
            const controls = {
                video: player.querySelector('video'),
                centerPlayBtn: player.querySelector('.video-center-play'),
                playPauseBtn: player.querySelector('.play-pause-btn'),
                iconPlay: player.querySelector('.icon-play'),
                iconPause: player.querySelector('.icon-pause'),
                progressBar: player.querySelector('.progress-bar'),
                progressFilled: player.querySelector('.progress-filled'),
                progressHover: player.querySelector('.progress-hover'),
                progressTooltip: player.querySelector('.progress-tooltip'),
                currentTimeEl: player.querySelector('.current-time'),
                totalTimeEl: player.querySelector('.total-time'),
                volumeBtn: player.querySelector('.volume-btn'),
                iconVolHigh: player.querySelector('.icon-volume-high'),
                iconVolMuted: player.querySelector('.icon-volume-muted'),
                volumeSlider: player.querySelector('.volume-slider'),
                volumeHover: player.querySelector('.volume-hover'),
                volumeFilled: player.querySelector('.volume-filled'),
                volumeTooltip: player.querySelector('.volume-tooltip'),
                fullscreenBtn: player.querySelector('.fullscreen-btn'),
                iconFullscreen: player.querySelector('.icon-fullscreen'),
                iconFullscreenExit: player.querySelector('.icon-fullscreen-exit'),
                controlsBar: player.querySelector('.video-controls')
            };

            if (!controls.video || !controls.playPauseBtn || !controls.progressBar || !controls.volumeBtn || !controls.fullscreenBtn) {
                return;
            }

            setupVideoPlayer(player, controls);
        });
    }

    function setupVideoPlayer(player, controls) {
        const { video } = controls;
        const spaPage = player.closest('.spa-page');
        let hideControlsTimeout = null;
        let lastVolume = Number(video.volume) || 1;

        player.classList.add('is-paused');

        function formatTime(seconds) {
            if (!Number.isFinite(seconds)) return '0:00';

            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
        }

        function syncPlayState() {
            const isPaused = video.paused || video.ended;

            player.classList.toggle('is-playing', !isPaused);
            player.classList.toggle('is-paused', isPaused);

            if (controls.iconPlay) controls.iconPlay.style.display = isPaused ? 'block' : 'none';
            if (controls.iconPause) controls.iconPause.style.display = isPaused ? 'none' : 'block';
            controls.playPauseBtn.setAttribute('aria-label', isPaused ? 'Videó lejátszása' : 'Videó szüneteltetése');
            if (controls.centerPlayBtn) controls.centerPlayBtn.setAttribute('aria-label', isPaused ? 'Videó lejátszása' : 'Videó szüneteltetése');

            if (isPaused) {
                showControls();
                clearTimeout(hideControlsTimeout);
                player.style.cursor = 'default';
            } else {
                resetControlsTimeout();
            }
        }

        function syncProgress() {
            const duration = Number.isFinite(video.duration) ? video.duration : 0;
            const progressPercent = duration ? (video.currentTime / duration) * 100 : 0;

            if (controls.currentTimeEl) controls.currentTimeEl.textContent = formatTime(video.currentTime);
            if (controls.totalTimeEl) controls.totalTimeEl.textContent = formatTime(duration);
            controls.progressBar.value = progressPercent;
            if (controls.progressFilled) controls.progressFilled.style.width = `${progressPercent}%`;
        }

        function syncVolumeState() {
            const currentVolume = video.muted ? 0 : Number(video.volume);

            if (controls.volumeFilled) controls.volumeFilled.style.width = `${currentVolume * 100}%`;
            controls.volumeSlider.value = currentVolume;
            controls.volumeBtn.setAttribute('aria-label', currentVolume === 0 ? 'Videó hangosítása' : 'Videó némítása');

            if (controls.iconVolHigh) controls.iconVolHigh.style.display = currentVolume === 0 ? 'none' : 'block';
            if (controls.iconVolMuted) controls.iconVolMuted.style.display = currentVolume === 0 ? 'block' : 'none';
        }

        function showControls() {
            if (controls.controlsBar) controls.controlsBar.style.opacity = '1';
        }

        function resetControlsTimeout() {
            player.style.cursor = 'default';
            showControls();
            clearTimeout(hideControlsTimeout);

            if (!video.paused) {
                hideControlsTimeout = window.setTimeout(() => {
                    player.style.cursor = 'none';
                    if (controls.controlsBar) controls.controlsBar.style.opacity = '0';
                }, 2500);
            }
        }

        function togglePlay() {
            if (video.paused || video.ended) {
                const playAttempt = video.play();

                if (playAttempt && typeof playAttempt.catch === 'function') {
                    playAttempt.catch(() => {
                        syncPlayState();
                    });
                }
            } else {
                video.pause();
            }
        }

        function seekBy(seconds) {
            if (!Number.isFinite(video.duration)) return;

            video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
            syncProgress();
        }

        function setVolume(value) {
            const nextVolume = Math.max(0, Math.min(1, value));

            video.volume = nextVolume;
            video.muted = nextVolume === 0;

            if (nextVolume > 0) {
                lastVolume = nextVolume;
            }

            syncVolumeState();
        }

        function toggleMute() {
            if (video.muted || video.volume === 0) {
                setVolume(lastVolume > 0 ? lastVolume : 1);
                video.muted = false;
            } else {
                lastVolume = video.volume;
                video.muted = true;
                controls.volumeSlider.value = 0;
            }

            syncVolumeState();
        }

        function syncFullscreenButton() {
            const isFull = Boolean(spaPage && spaPage.classList.contains('is-fullscreen'));

            if (controls.iconFullscreen) controls.iconFullscreen.style.display = isFull ? 'none' : 'block';
            if (controls.iconFullscreenExit) controls.iconFullscreenExit.style.display = isFull ? 'block' : 'none';
            controls.fullscreenBtn.setAttribute('aria-label', isFull ? 'Színház mód kikapcsolása' : 'Színház mód bekapcsolása');
        }

        function setTheaterMode(isFull) {
            if (!spaPage) return;

            spaPage.classList.toggle('is-fullscreen', isFull);
            document.body.classList.toggle('fullscreen-active', Boolean(document.querySelector('.spa-page.is-fullscreen')));
            syncFullscreenButton();

            window.setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 400);
        }

        function toggleTheaterMode() {
            setTheaterMode(!(spaPage && spaPage.classList.contains('is-fullscreen')));
        }

        controls.centerPlayBtn?.addEventListener('click', event => {
            event.stopPropagation();
            togglePlay();
        });

        controls.playPauseBtn.addEventListener('click', togglePlay);
        video.addEventListener('click', togglePlay);
        video.addEventListener('play', syncPlayState);
        video.addEventListener('pause', syncPlayState);
        video.addEventListener('ended', syncPlayState);
        video.addEventListener('loadedmetadata', syncProgress);
        video.addEventListener('durationchange', syncProgress);
        video.addEventListener('timeupdate', syncProgress);
        video.addEventListener('volumechange', syncVolumeState);

        controls.progressBar.addEventListener('input', event => {
            if (!Number.isFinite(video.duration)) return;

            const nextTime = (Number(event.target.value) / 100) * video.duration;
            video.currentTime = nextTime;
            syncProgress();
        });

        controls.progressBar.addEventListener('mousemove', event => {
            const rect = controls.progressBar.getBoundingClientRect();
            const position = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));

            if (controls.progressHover) controls.progressHover.style.width = `${position * 100}%`;
            if (controls.progressTooltip) {
                controls.progressTooltip.textContent = formatTime(position * video.duration);
                controls.progressTooltip.style.left = `${position * 100}%`;
            }
        });

        controls.progressBar.addEventListener('mouseleave', () => {
            if (controls.progressHover) controls.progressHover.style.width = '0%';
        });

        controls.volumeBtn.addEventListener('click', toggleMute);

        controls.volumeSlider.addEventListener('input', event => {
            setVolume(Number(event.target.value));
        });

        controls.volumeSlider.addEventListener('mousemove', event => {
            const rect = controls.volumeSlider.getBoundingClientRect();
            const position = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
            const percent = Math.round(position * 100);

            if (controls.volumeHover) controls.volumeHover.style.width = `${percent}%`;
            if (controls.volumeTooltip) {
                controls.volumeTooltip.textContent = `${percent}%`;
                controls.volumeTooltip.style.left = `${percent}%`;
            }
        });

        controls.volumeSlider.addEventListener('mouseleave', () => {
            if (controls.volumeHover) controls.volumeHover.style.width = '0%';
        });

        controls.fullscreenBtn.addEventListener('click', toggleTheaterMode);

        player.addEventListener('mousemove', resetControlsTimeout);
        player.addEventListener('mouseleave', () => {
            if (!video.paused && controls.controlsBar) {
                controls.controlsBar.style.opacity = '0';
            }
        });

        player.videoControlsApi = {
            togglePlay,
            toggleMute,
            toggleTheaterMode,
            seekBy,
            setVolume,
            syncFullscreenButton
        };

        syncProgress();
        syncVolumeState();
        syncFullscreenButton();
    }

    document.addEventListener('keydown', event => {
        if (event.defaultPrevented || isTypingTarget(event.target)) return;

        if (event.key === 'Escape') {
            const fullscreenPage = document.querySelector('.spa-page.is-fullscreen');
            if (fullscreenPage) {
                exitTheaterMode(fullscreenPage);
                event.preventDefault();
            }
            return;
        }

        const activePage = pages[currentPage];
        const player = activePage?.querySelector('.custom-player');
        const controlsApi = player?.videoControlsApi;
        if (!controlsApi) return;

        switch (event.key.toLowerCase()) {
            case ' ':
            case 'k':
                controlsApi.togglePlay();
                event.preventDefault();
                break;
            case 'm':
                controlsApi.toggleMute();
                event.preventDefault();
                break;
            case 'f':
                controlsApi.toggleTheaterMode();
                event.preventDefault();
                break;
            case 'arrowleft':
                controlsApi.seekBy(-5);
                event.preventDefault();
                break;
            case 'arrowright':
                controlsApi.seekBy(5);
                event.preventDefault();
                break;
            case 'arrowup':
                controlsApi.setVolume(Number(player.querySelector('video').volume) + 0.05);
                event.preventDefault();
                break;
            case 'arrowdown':
                controlsApi.setVolume(Number(player.querySelector('video').volume) - 0.05);
                event.preventDefault();
                break;
        }
    });

    function isTypingTarget(target) {
        if (!(target instanceof HTMLElement)) return false;

        const tagName = target.tagName.toLowerCase();
        return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable;
    }
});
