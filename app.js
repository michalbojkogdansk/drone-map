// Initialize map centered on Poland
const map = L.map('map').setView([52.0, 19.0], 6);

// Add dark tile layer (CartoDB Dark Matter)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

// Custom drone icon
const droneIcon = L.divIcon({
    className: 'drone-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -15]
});

// Modal elements
const modal = document.getElementById('video-modal');
const modalTitle = document.getElementById('modal-title');
const modalDescription = document.getElementById('modal-description');
const modalDate = document.getElementById('modal-date');
const modalLocation = document.getElementById('modal-location');
const modalVideoContainer = document.getElementById('modal-video-container');
const closeBtn = document.querySelector('.close-btn');

// Panel elements
const locationsList = document.getElementById('locations-list');
const showMoreBtn = document.getElementById('show-more-btn');
const showLessBtn = document.getElementById('show-less-btn');

// State
let allLocations = [];
let markers = {};
let showingAll = false;
const INITIAL_DISPLAY = 10;

// Extract YouTube video ID from various URL formats
function getYouTubeId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
        /youtube\.com\/shorts\/([^&\?\/]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Close modal
function closeModal() {
    modal.style.display = 'none';
    modalVideoContainer.innerHTML = ''; // Remove iframe to stop video
}

closeBtn.onclick = closeModal;

window.onclick = (e) => {
    if (e.target === modal) closeModal();
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'block') closeModal();
});

// Open video modal
function openVideo(location) {
    modalTitle.textContent = location.title;
    modalDescription.textContent = location.description;
    modalDate.textContent = location.date;
    modalLocation.textContent = location.place;
    
    const videoId = getYouTubeId(location.video);
    if (videoId) {
        modalVideoContainer.innerHTML = `
            <iframe 
                src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
    } else {
        modalVideoContainer.innerHTML = '<p style="color: #e94560;">Błąd: nieprawidłowy link YouTube</p>';
    }
    
    modal.style.display = 'block';
}

// Make openVideo available globally for popup buttons
window.openVideo = openVideo;

// Format date for display
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Render locations list
function renderLocationsList(showAll = false) {
    const locationsToShow = showAll ? allLocations : allLocations.slice(0, INITIAL_DISPLAY);
    
    locationsList.innerHTML = '';
    
    locationsToShow.forEach(loc => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="loc-title">${loc.title}</div>
            <div class="loc-date">${formatDate(loc.date)}</div>
        `;
        li.onclick = () => {
            map.setView([loc.lat, loc.lng], 12);
            markers[loc.id].openPopup();
        };
        locationsList.appendChild(li);
    });
    
    // Update buttons visibility
    if (allLocations.length > INITIAL_DISPLAY) {
        if (showAll) {
            showMoreBtn.style.display = 'none';
            showLessBtn.style.display = 'block';
        } else {
            showMoreBtn.style.display = 'block';
            showLessBtn.style.display = 'none';
        }
    } else {
        showMoreBtn.style.display = 'none';
        showLessBtn.style.display = 'none';
    }
}

// Button handlers
showMoreBtn.onclick = () => {
    showingAll = true;
    renderLocationsList(true);
};

showLessBtn.onclick = () => {
    showingAll = false;
    renderLocationsList(false);
};

// Load locations and add markers
fetch('locations.json')
    .then(response => response.json())
    .then(locations => {
        // Sort by date (newest first)
        allLocations = locations.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        allLocations.forEach(loc => {
            const marker = L.marker([loc.lat, loc.lng], { icon: droneIcon }).addTo(map);
            markers[loc.id] = marker;
            
            // Create popup content
            const popupContent = `
                <div class="popup-content">
                    <h3>${loc.title}</h3>
                    <p>${loc.place}</p>
                    <button class="play-btn" onclick='openVideo(${JSON.stringify(loc).replace(/'/g, "&#39;")})'>
                        ▶ Odtwórz
                    </button>
                </div>
            `;
            
            marker.bindPopup(popupContent);
        });
        
        // Render list panel
        renderLocationsList(false);
        
        console.log(`Loaded ${allLocations.length} drone locations`);
    })
    .catch(error => {
        console.error('Error loading locations:', error);
    });
