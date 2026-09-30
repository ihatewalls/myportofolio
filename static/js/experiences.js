    const { experiencesUrl, deleteUrlTemplate, starUrlTemplate, editUrlTemplate, editAccess, csrfToken } = window.APP_CONFIG;
    const PLACEHOLDER = '00000000-0000-0000-0000-000000000000';
    const BASE_EXPERIENCES_ENDPOINT = experiencesUrl;
    const EDIT_ACCESS = editAccess;
    let experiencesAbortController;

    const csrfInput = `<input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}">`;

    // DOM elements
    const loadingState = document.getElementById('loading');
    const errorState = document.getElementById('error');
    const emptyState = document.getElementById('empty');
    const gridContainer = document.getElementById('grid');
    const searchForm = document.getElementById('universal-search-form');
    const searchInput = document.getElementById('search-input');
    const SEARCH_DEBOUNCE_DELAY = 300;
    let searchDebounceTimer;
    // Show/hide page sections
    function displayPageSection({ showLoading = false, showError = false, showEmpty = false, showGrid = false }) {
        loadingState.classList.toggle('hide', !showLoading);
        errorState.classList.toggle('hide', !showError);
        emptyState.classList.toggle('hide', !showEmpty);
        gridContainer.classList.toggle('hide', !showGrid);
    }

    // Build a experience card element
    function buildExperienceCardElement(item) {
        const experience = item.fields;
        const experienceId = item.pk;

        const articleElement = document.createElement('article');
        articleElement.className = 'universal-card';


        // A dummy UUID used as a placeholder to be replaced with the real ID from the JSON data
        const deleteUrl = deleteUrlTemplate.replace(PLACEHOLDER, experienceId);
        const starUrl = starUrlTemplate.replace(PLACEHOLDER, experienceId);
        const editUrl = editUrlTemplate.replace(PLACEHOLDER, experienceId);
        const deleteHtml = EDIT_ACCESS 
            ? `<form method="post" action="${deleteUrl}" style="display:inline;">
                ${csrfInput}
                <button type="submit" class="button button-danger" onclick="return confirm('Are you sure you want to delete this experience?');">Delete</button>
            </form>`
            : '';
        const editHtml = EDIT_ACCESS
            ? `<a href='${editUrl}' class='button universal-add-button'><span aria-hidden='true'>+</span>Edit Experience</a>`
            : '';
        const isStarredClass = experience.is_starred ? " is-starred" : "";
        const starText = experience.is_starred ? "Unstar" : "Star";
        const starTitle = experience.star_count > 0 
            ? `Starred by ${experience.starred_by_names}` 
            : "Be the first to star";

        // Card component
        const completeCardHtml = `
            <h2>${experience.title}</h2>
            <span class="universal-category">${experience.category}</span>
            <p class="universal-description">${experience.description}</p>
            <div class="universal-card-actions">
                <div class="universal-actions">
                    <form method="post" action="${starUrl}" class="star-form">
                        ${csrfInput}
                        <button type="submit" 
                                class="button button-star${isStarredClass}"
                                title="${starTitle}">
                            <span aria-hidden="true">★</span>
                            ${starText}
                            <span class="star-count">${experience.star_count}</span>
                        </button>
                    </form>
                    ${editHtml}
                    ${deleteHtml}
                </div>
            </div>
        `;

        articleElement.innerHTML = completeCardHtml;
        return articleElement;
    }

    // Fetch experience data
    async function fetchExperiences(searchQuery = "") {
        if (experiencesAbortController) experiencesAbortController.abort();
        experiencesAbortController = new AbortController();

        try {
            displayPageSection({ showLoading: true });
            
            const url = searchQuery ? `${BASE_EXPERIENCES_ENDPOINT}?title=${encodeURIComponent(searchQuery)}` : BASE_EXPERIENCES_ENDPOINT;
            
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' },
                signal: experiencesAbortController.signal,
            });

            if (!response.ok) throw new Error('Failed to fetch data');

            const experienceData = await response.json();

            if (experienceData.length === 0) {
                displayPageSection({ showEmpty: true });
            } else {
                gridContainer.innerHTML = '';
                experienceData.forEach(item => {
                    gridContainer.appendChild(buildExperienceCardElement(item));
                });
                displayPageSection({ showGrid: true });
            }
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error('Error loading experiences:', error);
            displayPageSection({ showError: true });
        }
    }

    function searchExperiences() {
        fetchExperiences(searchInput.value.trim());
    }

    searchInput.addEventListener("input", function() {
        clearTimeout(searchDebounceTimer);

        searchDebounceTimer = setTimeout(function() {
            searchSkills();
        }, SEARCH_DEBOUNCE_DELAY);
    });

    searchForm.addEventListener("submit", function(event) {
        event.preventDefault();
        clearTimeout(searchDebounceTimer);
        searchExperiences();
    });
    // Start the application
    fetchExperiences(searchInput.value.trim());
