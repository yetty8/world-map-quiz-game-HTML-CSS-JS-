let map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

const countries = [
  { name: 'Ethiopia', coords: [9.145, 40.4897] },
  { name: 'Canada', coords: [56.1304, -106.3468] },
  { name: 'Brazil', coords: [-14.235, -51.9253] },
  { name: 'Japan', coords: [36.2048, 138.2529] },
  { name: 'France', coords: [46.6034, 1.8883] },
  { name: 'Nigeria', coords: [9.082, 8.6753] }
];

let currentCountry = null;
let marker = null;
let score = 0;

function highlightRandomCountry() {
  const randomIndex = Math.floor(Math.random() * countries.length);
  currentCountry = countries[randomIndex];
  if (marker) marker.remove();
  marker = L.circleMarker(currentCountry.coords, {
    color: 'yellow',
    radius: 10,
    fillOpacity: 0.7
  }).addTo(map);
  map.setView(currentCountry.coords, 3);
}

function updateScore() {
  document.getElementById('score').textContent = score;
}

function setLight(color) {
  const light = document.getElementById('status-light');
  light.style.backgroundColor = color;
}

document.getElementById('submit-btn').addEventListener('click', () => {
  const userInput = document.getElementById('country-input').value.trim();
  if (!currentCountry) return;

  if (userInput.toLowerCase() === currentCountry.name.toLowerCase()) {
    score++;
    updateScore();
    setLight('green');
    document.getElementById('country-input').value = '';
    highlightRandomCountry();
    } else {
    setLight('red');
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('submit-btn').disabled = true;
    }
    });
    
    
    highlightRandomCountry();
     
    