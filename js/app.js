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
    const loadCourses = async (isBackgroundRefresh = false) => {
        try {
            // Utilisation de l'API GitHub pour obtenir la version brute la plus récente (contourne le cache GitHub Pages CDN)
            const timestamp = new Date().getTime();
            const response = await fetch(`https://api.github.com/repos/AdlenSouci/projet_cours_eleves/contents/data/cours.json?t=${timestamp}`, {
                headers: { 'Accept': 'application/vnd.github.v3+json' }
            });

            if (!response.ok) {
                throw new Error('Erreur réseau / API');
            }

            const fileData = await response.json();
            const decodedJson = decodeURIComponent(escape(atob(fileData.content)));

            // Seulement rerendre si le contenu a changé (pour ne pas faire clignoter l'UI)
            const newData = JSON.parse(decodedJson);
            if (JSON.stringify(allCourses) !== JSON.stringify(newData)) {
                allCourses = newData;
                renderCourses();
            }

            if (!isBackgroundRefresh) {
                loader.classList.add('hidden');
            }

        } catch (error) {
            console.error('Erreur lors du chargement des cours:', error);
            if (!isBackgroundRefresh) {
                loader.classList.add('hidden');
                errorState.classList.remove('hidden');
            }
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
        // Vérifier les nouveaux cours toutes les 30 secondes en arrière-plan
        setInterval(() => loadCourses(true), 30000);
    }
});
