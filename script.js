// Game Configuration
const CONFIG = {
    EASY: { time: 45, points: 10, hints: 3 },
    MEDIUM: { time: 30, points: 20, hints: 2 },
    HARD: { time: 15, points: 30, hints: 1 }
};

// Game State
let map, currentCountry, score = 0, streak = 0, timeLeft, timer, gameActive = false;
let gameMode = 'find'; // 'find' or 'name'
let difficulty = 'medium';
let hintsUsed = 0;
let achievements = {
    firstGame: false,
    perfectScore: false,
    masterExplorer: false,
    speedDemon: false
};

// Sample countries data
const countries = [
    { 
        name: 'United States', 
        code: 'us', 
        lat: 37.0902, 
        lng: -95.7129, 
        capital: 'Washington, D.C.', 
        population: 331002651, 
        area: 9833520 
    },
    { 
        name: 'France', 
        code: 'fr', 
        lat: 46.2276, 
        lng: 2.2137, 
        capital: 'Paris', 
        population: 65273511, 
        area: 551695 
    },
    { 
        name: 'Japan', 
        code: 'jp', 
        lat: 36.2048, 
        lng: 138.2529, 
        capital: 'Tokyo', 
        population: 126476461, 
        area: 377975 
    },
    { 
        name: 'Brazil', 
        code: 'br', 
        lat: -14.2350, 
        lng: -51.9253, 
        capital: 'Brasília', 
        population: 212559417, 
        area: 8515767 
    },
    { 
        name: 'Australia', 
        code: 'au', 
        lat: -25.2744, 
        lng: 133.7751, 
        capital: 'Canberra', 
        population: 25499884, 
        area: 7692024 
    }
];

// Initialize the map with better settings
function initMap() {
    map = L.map('map', {
        center: [20, 0],
        zoom: 2,
        zoomControl: false,
        minZoom: 2,
        maxBounds: [[-60, -180], [85, 190]],
        maxBoundsViscosity: 1.0
    });

    // Add map controls
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.control.scale({ imperial: false, metric: true, position: 'bottomright' }).addTo(map);

    // Add map layers
    const mapLayers = {
        'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }),
        'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles © Esri',
            maxZoom: 19
        })
    };

    // Add layer control and set default
    L.control.layers(mapLayers, null, {position: 'topleft'}).addTo(map);
    mapLayers['OpenStreetMap'].addTo(map);

    // Add fullscreen control
    if (L.control.fullscreen) {
        L.control.fullscreen({
            position: 'topleft',
            title: 'Toggle Fullscreen',
            titleCancel: 'Exit Fullscreen',
            content: '⛶',
            forceSeparateButton: true
        }).addTo(map);
    }

    // Add geolocation control
    L.control.locate({
        position: 'topleft',
        strings: { title: "Show my location" }
    }).addTo(map);

    // Initialize the game
    initGame();
}

// Initialize game state and UI
function initGame() {
    // Reset game state
    score = 0;
    streak = 0;
    gameActive = true;
    updateScore();
    updateStreak();
    updateDifficulty(difficulty);

    // Start the first round
    startNewRound();
}

// Start a new round
function startNewRound() {
    // Clear any existing markers and popups
    map.eachLayer(layer => {
        if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
            map.removeLayer(layer);
        }
    });

    // Reset round state
    hintsUsed = 0;
    updateHintsDisplay();
    document.getElementById('country-input').value = '';
    document.getElementById('country-input').focus();
    document.getElementById('flag-container').innerHTML = '';
    
    // Randomly choose game mode
    gameMode = Math.random() > 0.5 ? 'find' : 'name';
    
    if (gameMode === 'find') {
        startFindCountryRound();
    } else {
        startNameCountryRound();
    }
    
    // Start the timer
    startTimer();
}

// Start a "Find the Country" round
function startFindCountryRound() {
    document.getElementById('question-text').textContent = 'Find this country on the map!';
    currentCountry = getRandomCountry();
    
    // Add flag to question
    const flagContainer = document.getElementById('flag-container');
    flagContainer.innerHTML = `
        <div class="flag-wrapper">
            <span class="flag-icon flag-icon-${currentCountry.code.toLowerCase()}"></span>
        </div>
        <div class="country-name">${currentCountry.name}</div>
    `;
    
    // Add marker to the map
    const marker = L.marker(
        [currentCountry.lat, currentCountry.lng],
        { 
            icon: L.divIcon({
                className: 'custom-marker',
                html: '?',
                iconSize: [40, 40],
                iconAnchor: [20, 40]
            })
        }
    ).addTo(map);
    
    // Zoom to the country with some padding
    map.flyTo([currentCountry.lat, currentCountry.lng], 4, {
        duration: 1,
        animate: true
    });
}

// Start a "Name the Country" round
function startNameCountryRound() {
    currentCountry = getRandomCountry();
    const randomPoint = getRandomPointInCountry(currentCountry);
    
    document.getElementById('question-text').textContent = 'What country is this?';
    document.getElementById('flag-container').innerHTML = '';
    
    // Add marker to the random point
    L.marker(
        [randomPoint.lat, randomPoint.lng],
        { 
            icon: L.divIcon({
                className: 'custom-marker',
                html: '?',
                iconSize: [40, 40],
                iconAnchor: [20, 40]
            })
        }
    ).addTo(map);
    
    // Zoom to the point with some padding
    map.flyTo([randomPoint.lat, randomPoint.lng], 6, {
        duration: 1,
        animate: true
    });
}

// Get a random country from the list
function getRandomCountry() {
    const randomIndex = Math.floor(Math.random() * countries.length);
    return countries[randomIndex];
}

// Get a random point within a country's bounds
function getRandomPointInCountry(country) {
    // Simple approximation
    const lat = country.lat + (Math.random() - 0.5) * 10;
    const lng = country.lng + (Math.random() - 0.5) * 20;
    return { lat, lng };
}

// Check the user's answer
function checkAnswer() {
    if (!gameActive || !currentCountry) return;
    
    const userInput = document.getElementById('country-input').value.trim().toLowerCase();
    const correctAnswer = currentCountry.name.toLowerCase();
    
    if (userInput === correctAnswer) {
        handleCorrectAnswer();
    } else {
        handleWrongAnswer();
    }
}

// Handle correct answer
function handleCorrectAnswer() {
    playSound('correct-sound');
    score += CONFIG[difficulty.toUpperCase()].points * (1 + streak * 0.1); // Bonus for streaks
    streak++;
    updateScore();
    updateStreak();
    
    // Show feedback
    showFeedback('Correct!', 'success');
    
    // Show country fact
    showCountryFact(currentCountry);
    
    // Start new round after a delay
    setTimeout(startNewRound, 3000);
}

// Handle wrong answer
function handleWrongAnswer() {
    playSound('wrong-sound');
    streak = 0;
    updateStreak();
    
    // Show feedback
    showFeedback(`Incorrect! The answer was ${currentCountry.name}.`, 'error');
    
    // Show country fact
    showCountryFact(currentCountry);
    
    // Start new round after a delay
    setTimeout(startNewRound, 3000);
}

// Show feedback message
function showFeedback(message, type) {
    const feedback = document.createElement('div');
    feedback.className = `feedback ${type}`;
    feedback.textContent = message;
    document.body.appendChild(feedback);
    
    // Remove feedback after animation
    setTimeout(() => {
        feedback.remove();
    }, 3000);
}

// Show country fact
function showCountryFact(country) {
    const factBox = document.getElementById('country-fact');
    const factContent = document.getElementById('fact-content');
    const wikiLink = document.getElementById('wikipedia-link');
    
    // In a real app, you might want to fetch this from an API
    const facts = [
        `Did you know? ${country.name} has a population of about ${(country.population / 1000000).toFixed(1)} million people.`,
        `The capital of ${country.name} is ${country.capital || 'unknown'}.`,
        `${country.name} covers an area of ${(country.area / 1000).toFixed(0)} thousand square kilometers.`
    ];
    
    factContent.textContent = facts[Math.floor(Math.random() * facts.length)];
    wikiLink.href = `https://en.wikipedia.org/wiki/${country.name.replace(/\s+/g, '_')}`;
    factBox.style.display = 'block';
}

// Update score display
function updateScore() {
    document.getElementById('score').textContent = Math.floor(score);
}

// Update streak display
function updateStreak() {
    const streakElement = document.getElementById('streak');
    streakElement.textContent = streak;
    
    // Add visual feedback for streaks
    if (streak >= 5) {
        streakElement.classList.add('hot-streak');
    } else {
        streakElement.classList.remove('hot-streak');
    }
}

// Update difficulty
function updateDifficulty(newDifficulty) {
    difficulty = newDifficulty;
    const difficultyBadge = document.querySelector('.difficulty-badge');
    
    if (difficultyBadge) {
        difficultyBadge.remove();
    }
    
    const difficultyText = document.createElement('span');
    difficultyText.className = `difficulty-badge difficulty-${difficulty}`;
    difficultyText.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    document.querySelector('h1').appendChild(difficultyText);
    
    // Update timer based on difficulty
    timeLeft = CONFIG[difficulty.toUpperCase()].time;
    updateTimerDisplay();
}

// Start the timer
function startTimer() {
    clearInterval(timer);
    timeLeft = CONFIG[difficulty.toUpperCase()].time;
    updateTimerDisplay();
    
    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            handleTimeUp();
        }
    }, 1000);
}

// Update timer display
function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Visual feedback when time is running low
    if (timeLeft <= 10) {
        document.getElementById('timer').classList.add('time-running-out');
    } else {
        document.getElementById('timer').classList.remove('time-running-out');
    }
}

// Handle time up
function handleTimeUp() {
    playSound('wrong-sound');
    streak = 0;
    updateStreak();
    
    showFeedback('Time\'s up!', 'error');
    
    if (currentCountry) {
        showCountryFact(currentCountry);
        setTimeout(startNewRound, 3000);
    }
}

// Show hint
function showHint() {
    if (!currentCountry || hintsUsed >= CONFIG[difficulty.toUpperCase()].hints) return;
    
    hintsUsed++;
    updateHintsDisplay();
    
    const hintContent = document.getElementById('hint-content');
    let hintText = '';
    
    if (gameMode === 'find') {
        // For "Find the Country" mode
        switch(hintsUsed) {
            case 1:
                hintText = `The country starts with "${currentCountry.name[0]}"`;
                break;
            case 2:
                hintText = `The country has ${currentCountry.name.length} letters`;
                break;
            case 3:
                hintText = `The capital is ${currentCountry.capital || 'unknown'}`;
                break;
        }
    } else {
        // For "Name the Country" mode
        switch(hintsUsed) {
            case 1:
                hintText = `The country's flag is: <span class="flag-icon flag-icon-${currentCountry.code.toLowerCase()}"></span>`;
                break;
            case 2:
                hintText = `The capital is ${currentCountry.capital || 'unknown'}`;
                break;
            case 3:
                hintText = `The country has a population of about ${(currentCountry.population / 1000000).toFixed(1)} million`;
                break;
        }
    }
    
    hintContent.innerHTML = hintText;
    playSound('hint-sound');
}

// Update hints display
function updateHintsDisplay() {
    const maxHints = CONFIG[difficulty.toUpperCase()].hints;
    const hintsLeft = maxHints - hintsUsed;
    document.getElementById('hint-btn').textContent = `💡 Hint (${hintsLeft} left)`;
}

// Play sound effect
function playSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log('Audio play failed:', e));
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    
    // Event listeners
    document.getElementById('submit-btn').addEventListener('click', checkAnswer);
    document.getElementById('hint-btn').addEventListener('click', showHint);
    document.getElementById('giveup-btn').addEventListener('click', startNewRound);
    document.getElementById('difficulty').addEventListener('change', (e) => {
        updateDifficulty(e.target.value);
        startNewRound();
    });
    
    // Handle Enter key
    document.getElementById('country-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });
    
    // Show welcome message
    setTimeout(() => {
        showFeedback('Welcome to GeoGuess Quest!', 'info');
    }, 1000);
});