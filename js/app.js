document.addEventListener('DOMContentLoaded', () => {

    // Eléments DOM
    const coursesGrid = document.getElementById('coursGrid');
    const loader = document.getElementById('loader');
    const errorState = document.getElementById('errorState');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');
    const filterBtns = document.querySelectorAll('.filter-btn');

    let allCourses = [];
    let currentFilter = 'all';
    let searchQuery = '';

    // Formatter de date (ex: 24 Fév 2024)
    const formatDate = (dateStr) => {
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date(dateStr).toLocaleDateString('fr-FR', options);
    };

    // Chargement des données JSON
    const loadCourses = async () => {
        try {
            // Note: En dev local sans serveur, fetch peut bloquer sur des fichiers locaux via file://
            // Ajout d'un timestamp pour forcer le navigateur à télécharger la dernière version sur GitHub Pages
            const timestamp = new Date().getTime();
            const response = await fetch(`./data/cours.json?t=${timestamp}`, { cache: 'no-store' });

            if (!response.ok) {
                throw new Error('Erreur réseau');
            }

            const data = await response.json();
            allCourses = data;

            // Masquer le loader et afficher la grille
            loader.classList.add('hidden');
            renderCourses();

        } catch (error) {
            console.error('Erreur lors du chargement des cours:', error);
            loader.classList.add('hidden');
            errorState.classList.remove('hidden');
        }
    };

    // Rendu des cartes de cours
    const renderCourses = () => {
        // Filtrage
        const filtered = allCourses.filter(course => {
            const matchType = currentFilter === 'all' || course.type === currentFilter;
            const matchSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchType && matchSearch;
        });

        // Vider la grille
        coursesGrid.innerHTML = '';

        if (filtered.length === 0) {
            coursesGrid.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        coursesGrid.classList.remove('hidden');

        // Création des cartes
        filtered.forEach(course => {
            // L'URL mène vers le viewer
            const linkUrl = `./lecon.html?file=${encodeURIComponent(course.file)}&title=${encodeURIComponent(course.title)}`;

            const card = document.createElement('a');
            card.href = linkUrl;
            card.className = 'course-card';

            const iconType = course.type === 'cours' ? 'book-open' : 'check-square';

            card.innerHTML = `
                <div class="card-header">
                    <span class="card-badge badge-${course.type}">${course.type}</span>
                    <span class="card-date">${formatDate(course.date)}</span>
                </div>
                <h3 class="card-title">${course.title}</h3>
                <p class="card-desc">${course.description}</p>
                <div class="card-footer">
                    <div class="card-meta">
                        <i data-lucide="${iconType}"></i>
                        <span>${course.duration || 'Auto-rythmé'}</span>
                    </div>
                    <span class="card-link">Consulter <i data-lucide="arrow-right"></i></span>
                </div>
            `;

            coursesGrid.appendChild(card);
        });

        // Ré-initialiser les icônes sur le nouveau DOM
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    };

    // Événements Recherche
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderCourses();
        });
    }

    // Événements Filtres
    if (filterBtns) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Retirer actif sur tous
                filterBtns.forEach(b => b.classList.remove('active'));
                // Mettre actif sur cliqué
                e.target.classList.add('active');

                currentFilter = e.target.getAttribute('data-filter');
                renderCourses();
            });
        });
    }

    // Lancer le chargement si on est sur la page d'accueil
    if (coursesGrid) {
        loadCourses();
    }
});
