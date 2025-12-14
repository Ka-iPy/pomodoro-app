/**
 * Pomodoro Focus Timer Application
 * Features:
 * - Work, Short Break, and Long Break timers
 * - Auto-transition between timer modes
 * - YouTube audio playback integration
 * - Custom background support
 */

// ===== Configuration =====
const DEFAULT_CONFIG = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4
};

// ===== State Management =====
const state = {
    // Timer state
    currentMode: 'work', // 'work', 'shortBreak', 'longBreak'
    isRunning: false,
    timeRemaining: DEFAULT_CONFIG.workDuration * 60, // in seconds
    totalTime: DEFAULT_CONFIG.workDuration * 60,
    currentSession: 1,
    timerInterval: null,

    // Settings
    settings: { ...DEFAULT_CONFIG },

    // YouTube player
    youtubePlayer: null,
    isYouTubeReady: false
};

// ===== DOM Elements =====
const elements = {
    // Timer elements
    timerMinutes: document.getElementById('timer-minutes'),
    timerSeconds: document.getElementById('timer-seconds'),
    timerRingProgress: document.getElementById('timer-ring-progress'),
    modeLabel: document.getElementById('mode-label'),
    sessionCounter: document.getElementById('session-counter'),

    // Timer controls
    btnStart: document.getElementById('btn-start'),
    btnPause: document.getElementById('btn-pause'),
    btnReset: document.getElementById('btn-reset'),

    // Settings inputs
    workDuration: document.getElementById('work-duration'),
    shortBreak: document.getElementById('short-break'),
    longBreak: document.getElementById('long-break'),
    sessionsBeforeLong: document.getElementById('sessions-before-long'),

    // YouTube elements
    youtubeUrl: document.getElementById('youtube-url'),
    btnLoadVideo: document.getElementById('btn-load-video'),
    youtubePlayerContainer: document.getElementById('youtube-player-container'),
    btnPlayAudio: document.getElementById('btn-play-audio'),
    btnPauseAudio: document.getElementById('btn-pause-audio'),
    volumeSlider: document.getElementById('volume-slider'),

    // Background elements
    backgroundLayer: document.getElementById('background-layer'),
    presetBtns: document.querySelectorAll('.preset-btn'),
    customBgUrl: document.getElementById('custom-bg-url'),
    btnApplyBg: document.getElementById('btn-apply-bg'),
    bgFileInput: document.getElementById('bg-file-input'),
    btnResetBg: document.getElementById('btn-reset-bg'),

    // Audio notification
    notificationSound: document.getElementById('notification-sound')
};

// ===== Timer Functions =====

/**
 * Format seconds to MM:SS display
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
        minutes: mins.toString().padStart(2, '0'),
        seconds: secs.toString().padStart(2, '0')
    };
}

/**
 * Update the timer display
 */
function updateTimerDisplay() {
    const time = formatTime(state.timeRemaining);
    elements.timerMinutes.textContent = time.minutes;
    elements.timerSeconds.textContent = time.seconds;

    // Update progress ring
    const circumference = 2 * Math.PI * 90; // r = 90
    const progress = state.timeRemaining / state.totalTime;
    const offset = circumference * (1 - progress);
    elements.timerRingProgress.style.strokeDashoffset = offset;

    // Update page title
    document.title = `${time.minutes}:${time.seconds} - Pomodoro Focus`;
}

/**
 * Update mode indicator and styling
 */
function updateModeDisplay() {
    const modeLabels = {
        work: 'Work Time',
        shortBreak: 'Short Break',
        longBreak: 'Long Break'
    };

    const modeClasses = {
        work: 'work',
        shortBreak: 'short-break',
        longBreak: 'long-break'
    };

    elements.modeLabel.textContent = modeLabels[state.currentMode];
    elements.modeLabel.className = `mode-label ${modeClasses[state.currentMode]}`;
    elements.timerRingProgress.className = `timer-ring-progress ${modeClasses[state.currentMode]}`;

    // Update session counter
    elements.sessionCounter.textContent = `Session ${state.currentSession} of ${state.settings.sessionsBeforeLongBreak}`;
}

/**
 * Start the timer
 */
function startTimer() {
    if (state.isRunning) return;

    state.isRunning = true;
    elements.btnStart.disabled = true;
    elements.btnPause.disabled = false;

    state.timerInterval = setInterval(() => {
        state.timeRemaining--;
        updateTimerDisplay();

        if (state.timeRemaining <= 0) {
            timerComplete();
        }
    }, 1000);
}

/**
 * Pause the timer
 */
function pauseTimer() {
    if (!state.isRunning) return;

    state.isRunning = false;
    clearInterval(state.timerInterval);
    elements.btnStart.disabled = false;
    elements.btnPause.disabled = true;
}

/**
 * Reset the current timer
 */
function resetTimer() {
    pauseTimer();
    setTimerDuration();
    updateTimerDisplay();
    elements.btnStart.disabled = false;
    elements.btnPause.disabled = true;
}

/**
 * Set timer duration based on current mode
 */
function setTimerDuration() {
    const durations = {
        work: state.settings.workDuration * 60,
        shortBreak: state.settings.shortBreakDuration * 60,
        longBreak: state.settings.longBreakDuration * 60
    };

    state.timeRemaining = durations[state.currentMode];
    state.totalTime = durations[state.currentMode];
}

/**
 * Handle timer completion
 */
function timerComplete() {
    pauseTimer();
    playNotificationSound();

    // Auto-transition to next mode
    if (state.currentMode === 'work') {
        // Check if it's time for a long break
        if (state.currentSession >= state.settings.sessionsBeforeLongBreak) {
            state.currentMode = 'longBreak';
            state.currentSession = 1;
        } else {
            state.currentMode = 'shortBreak';
        }
    } else {
        // After any break, go back to work
        if (state.currentMode === 'shortBreak') {
            state.currentSession++;
        }
        state.currentMode = 'work';
    }

    setTimerDuration();
    updateModeDisplay();
    updateTimerDisplay();

    // Auto-start the next timer
    setTimeout(() => {
        startTimer();
    }, 1000);
}

/**
 * Play notification sound
 */
function playNotificationSound() {
    if (elements.notificationSound) {
        elements.notificationSound.currentTime = 0;
        elements.notificationSound.play().catch(e => console.log('Audio play failed:', e));
    }

    // Also try browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
        const modeLabels = {
            work: 'Time to work!',
            shortBreak: 'Take a short break!',
            longBreak: 'Take a long break!'
        };
        new Notification('Pomodoro Timer', {
            body: modeLabels[state.currentMode],
            icon: '🍅'
        });
    }
}

// ===== Settings Functions =====

/**
 * Update settings from input values
 */
function updateSettings() {
    state.settings.workDuration = parseInt(elements.workDuration.value) || DEFAULT_CONFIG.workDuration;
    state.settings.shortBreakDuration = parseInt(elements.shortBreak.value) || DEFAULT_CONFIG.shortBreakDuration;
    state.settings.longBreakDuration = parseInt(elements.longBreak.value) || DEFAULT_CONFIG.longBreakDuration;
    state.settings.sessionsBeforeLongBreak = parseInt(elements.sessionsBeforeLong.value) || DEFAULT_CONFIG.sessionsBeforeLongBreak;

    // If timer is not running, update the display
    if (!state.isRunning) {
        setTimerDuration();
        updateTimerDisplay();
        updateModeDisplay();
    }

    // Save to localStorage
    localStorage.setItem('pomodoroSettings', JSON.stringify(state.settings));
}

/**
 * Load settings from localStorage
 */
function loadSettings() {
    const saved = localStorage.getItem('pomodoroSettings');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state.settings = { ...DEFAULT_CONFIG, ...parsed };

            // Update input values
            elements.workDuration.value = state.settings.workDuration;
            elements.shortBreak.value = state.settings.shortBreakDuration;
            elements.longBreak.value = state.settings.longBreakDuration;
            elements.sessionsBeforeLong.value = state.settings.sessionsBeforeLongBreak;
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    }
}

// ===== YouTube Functions =====

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Load YouTube video
 */
function loadYouTubeVideo() {
    const url = elements.youtubeUrl.value.trim();
    const videoId = extractYouTubeId(url);

    if (!videoId) {
        alert('Please enter a valid YouTube URL');
        return;
    }

    elements.youtubePlayerContainer.classList.remove('hidden');

    if (state.youtubePlayer && state.isYouTubeReady) {
        state.youtubePlayer.loadVideoById(videoId);
    } else {
        // Player will be created by onYouTubeIframeAPIReady
        createYouTubePlayer(videoId);
    }
}

/**
 * Create YouTube player
 */
function createYouTubePlayer(videoId) {
    if (state.youtubePlayer) {
        // If it's an API object, destroy it
        if (typeof state.youtubePlayer.destroy === 'function') {
            state.youtubePlayer.destroy();
        }
        state.youtubePlayer = null;
    }

    // Check for file:// protocol restrictions
    if (window.location.protocol === 'file:') {
        console.warn('Running from file:// protocol. Some YouTube videos may be restricted.');
    }

    // 1. Create the iframe manually
    const iframe = document.createElement('iframe');
    iframe.id = 'youtube-player';
    iframe.width = '100%';
    iframe.height = '100%';

    // Construct src with parameters
    let src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&controls=1&modestbranding=1&rel=0`;

    // Add origin if on server
    if (window.location.protocol.startsWith('http')) {
        src += `&origin=${encodeURIComponent(window.location.origin)}`;
    }

    iframe.src = src;
    iframe.frameBorder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;

    // 2. Replace the container's content (or the old player)
    const container = document.getElementById('youtube-player-container');
    // Find the player div or existing iframe
    let oldElement = document.getElementById('youtube-player');

    if (!oldElement) {
        // If lost, recreate the wrapper
        oldElement = document.createElement('div');
        oldElement.id = 'youtube-player';
        container.insertBefore(oldElement, container.firstChild);
    }

    oldElement.parentNode.replaceChild(iframe, oldElement);

    // 3. Initialize the API on the new iframe
    // We need a slight delay to ensure iframe is in DOM
    setTimeout(() => {
        state.youtubePlayer = new YT.Player('youtube-player', {
            events: {
                onReady: onPlayerReady,
                onStateChange: onPlayerStateChange,
                onError: onPlayerError
            }
        });
    }, 100);
}

/**
 * YouTube player ready callback
 */
function onPlayerReady(event) {
    state.isYouTubeReady = true;
    event.target.setVolume(parseInt(elements.volumeSlider.value));
}

/**
 * YouTube player state change callback
 */
function onPlayerStateChange(event) {
    // Update play/pause button states based on player state
    if (event.data === YT.PlayerState.PLAYING) {
        elements.btnPlayAudio.style.opacity = '0.5';
        elements.btnPauseAudio.style.opacity = '1';
    } else {
        elements.btnPlayAudio.style.opacity = '1';
        elements.btnPauseAudio.style.opacity = '0.5';
    }
}

/**
 * YouTube player error callback
 */
function onPlayerError(event) {
    const errorMessages = {
        2: 'Invalid video ID. Please check the URL.',
        5: 'This video cannot be played in an embedded player.',
        100: 'Video not found or has been removed.',
        101: 'The video owner has disabled embedding.',
        150: 'The video owner has disabled embedding.'
    };

    const message = errorMessages[event.data] || `YouTube Error ${event.data}: Unable to play this video.`;
    alert(message);
    console.error('YouTube Player Error:', event.data, message);
}

// Global callback for YouTube IFrame API
window.onYouTubeIframeAPIReady = function () {
    state.isYouTubeReady = true;
};

// ===== Background Functions =====

/**
 * Set gradient background
 */
function setGradientBackground(gradient) {
    elements.backgroundLayer.style.backgroundImage = gradient;
    elements.backgroundLayer.style.backgroundColor = '';

    // Update active preset button
    elements.presetBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.gradient === gradient);
    });

    // Save preference
    localStorage.setItem('pomodoroBackground', JSON.stringify({ type: 'gradient', value: gradient }));
}

/**
 * Set image background
 */
function setImageBackground(imageUrl) {
    elements.backgroundLayer.style.backgroundImage = `url('${imageUrl}')`;

    // Remove active class from preset buttons
    elements.presetBtns.forEach(btn => btn.classList.remove('active'));

    // Save preference
    localStorage.setItem('pomodoroBackground', JSON.stringify({ type: 'image', value: imageUrl }));
}

/**
 * Handle file upload for background
 */
function handleBackgroundFileUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        setImageBackground(e.target.result);
    };
    reader.readAsDataURL(file);
}

/**
 * Load saved background preference
 */
function loadBackgroundPreference() {
    const saved = localStorage.getItem('pomodoroBackground');
    if (saved) {
        try {
            const { type, value } = JSON.parse(saved);
            if (type === 'gradient') {
                setGradientBackground(value);
            } else if (type === 'image') {
                setImageBackground(value);
            }
        } catch (e) {
            console.error('Failed to load background preference:', e);
        }
    }
}

// ===== Event Listeners =====

function initEventListeners() {
    // Timer controls
    elements.btnStart.addEventListener('click', startTimer);
    elements.btnPause.addEventListener('click', pauseTimer);
    elements.btnReset.addEventListener('click', resetTimer);

    // Settings inputs
    [elements.workDuration, elements.shortBreak, elements.longBreak, elements.sessionsBeforeLong].forEach(input => {
        input.addEventListener('change', updateSettings);
    });

    // YouTube controls
    elements.btnLoadVideo.addEventListener('click', loadYouTubeVideo);
    elements.youtubeUrl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loadYouTubeVideo();
    });

    elements.btnPlayAudio.addEventListener('click', () => {
        if (state.youtubePlayer && state.isYouTubeReady) {
            state.youtubePlayer.playVideo();
        }
    });

    elements.btnPauseAudio.addEventListener('click', () => {
        if (state.youtubePlayer && state.isYouTubeReady) {
            state.youtubePlayer.pauseVideo();
        }
    });

    elements.volumeSlider.addEventListener('input', (e) => {
        if (state.youtubePlayer && state.isYouTubeReady) {
            state.youtubePlayer.setVolume(parseInt(e.target.value));
        }
    });

    // Background controls
    elements.presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setGradientBackground(btn.dataset.gradient);
        });
    });

    elements.btnApplyBg.addEventListener('click', () => {
        const url = elements.customBgUrl.value.trim();
        if (url) {
            setImageBackground(url);
        }
    });

    elements.customBgUrl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const url = elements.customBgUrl.value.trim();
            if (url) {
                setImageBackground(url);
            }
        }
    });

    elements.bgFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleBackgroundFileUpload(file);
        }
    });

    elements.btnResetBg.addEventListener('click', () => {
        setGradientBackground('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
        elements.customBgUrl.value = '';
    });

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    // Handle visibility change (pause timer when tab is hidden - optional)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && state.isRunning) {
            // Timer continues running in background
            // Could add logic to pause here if desired
        }
    });
}

// ===== Initialization =====

function init() {
    loadSettings();
    loadBackgroundPreference();
    setTimerDuration();
    updateTimerDisplay();
    updateModeDisplay();
    initEventListeners();

    console.log('🍅 Pomodoro Focus Timer initialized');
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
