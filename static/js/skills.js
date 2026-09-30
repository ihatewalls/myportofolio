    const { skillsUrl, deleteUrlTemplate, editUrlTemplate, editAccess, csrfToken } = window.APP_CONFIG;
    const PLACEHOLDER = '00000000-0000-0000-0000-000000000000';
    const BASE_SKILLS_ENDPOINT = skillsUrl;
    const EDIT_ACCESS = editAccess;
    let skillsAbortController;

    const csrfInput = `<input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}">`;

    // DOM elements
    const loadingState = document.getElementById('loading');
    const errorState = document.getElementById('error');
    const emptyState = document.getElementById('empty');
    const gridContainer = document.getElementById('grid');
    const searchForm = document.getElementById('universal-search-form');
    const searchInput = document.getElementById('search-input');

    // Show/hide page sections
    function displayPageSection({ showLoading = false, showError = false, showEmpty = false, showGrid = false }) {
        loadingState.classList.toggle('hide', !showLoading);
        errorState.classList.toggle('hide', !showError);
        emptyState.classList.toggle('hide', !showEmpty);
        gridContainer.classList.toggle('hide', !showGrid);
    }

    // Build a skill card element
    function buildSkillCardElement(item) {
        const skill = item.fields;
        const skillId = item.pk;

        const articleElement = document.createElement('article');
        articleElement.className = 'universal-card';


        // A dummy UUID used as a placeholder to be replaced with the real ID from the JSON data
        const deleteUrl = deleteUrlTemplate.replace(PLACEHOLDER, skillId);
        const editUrl = editUrlTemplate.replace(PLACEHOLDER, skillId);
        const deleteHtml = EDIT_ACCESS 
            ? `<form method="post" action="${deleteUrl}" style="display:inline;">
                ${csrfInput}
                <button type="submit" class="button button-danger" onclick="return confirm('Are you sure you want to delete this skill?');">Delete</button>
            </form>`
            : '';
        const editHtml = EDIT_ACCESS
            ? `<a href='${editUrl}' class='button universal-add-button'><span aria-hidden='true'>+</span>Edit Skill</a>`
            : '';
        // Card component
        const completeCardHtml = `
            <h2>${skill.title}</h2>
            <span class="universal-category">${skill.category}</span>
            <p class="universal-description">${skill.description}</p>
            <div class="universal-card-actions">
                <div class="universal-actions">
                    ${editHtml}
                    ${deleteHtml}
                </div>
            </div>
        `;

        articleElement.innerHTML = completeCardHtml;
        return articleElement;
    }

    // Fetch skill data
    async function fetchSkills(searchQuery = "") {
        if (skillsAbortController) skillsAbortController.abort();
        skillsAbortController = new AbortController();

        try {
            displayPageSection({ showLoading: true });
            
            const url = searchQuery ? `${BASE_SKILLS_ENDPOINT}?title=${encodeURIComponent(searchQuery)}` : BASE_SKILLS_ENDPOINT;
            
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' },
                signal: skillsAbortController.signal,
            });

            if (!response.ok) throw new Error('Failed to fetch data');

            const skillData = await response.json();

            if (skillData.length === 0) {
                displayPageSection({ showEmpty: true });
            } else {
                gridContainer.innerHTML = '';
                skillData.forEach(item => {
                    gridContainer.appendChild(buildSkillCardElement(item));
                });
                displayPageSection({ showGrid: true });
            }
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error('Error loading skills:', error);
            displayPageSection({ showError: true });
        }
    }

    // Search form event handler
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent the page from reloading
        fetchSkills(searchInput.value.trim()); // Run the search via AJAX
    });

    // Start the application
    fetchSkills(searchInput.value.trim());
