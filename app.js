// Initialize map centered on Europe
const map = L.map('map').setView([52.0, 10.0], 5);

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

// Load locations and add markers
fetch('locations.json')
    .then(response => response.json())
    .then(locations => {
        locations.forEach(loc => {
            const marker = L.marker([loc.lat, loc.lng], { icon: droneIcon }).addTo(map);
            
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
        
        console.log(`Loaded ${locations.length} drone locations`);
    })
    .catch(error => {
        console.error('Error loading locations:', error);
    });
