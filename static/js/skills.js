    const { skillsUrl, createSkillUrl, deleteUrlTemplate, editUrlTemplate, editAccess, csrfToken } = window.APP_CONFIG;
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
            <h2>${escapeHtml(skill.title)}</h2>
            <span class="universal-category">${escapeHtml(skill.category)}</span>
            <p class="universal-description">${escapeHtml(skill.description)}</p>
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
    function searchSkills() {
        fetchSkills(searchInput.value.trim());
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
        searchSkills();
    });
    function closeSkillModal() {
        document.getElementById("add-skill-modal").hidePopover();
    }
    const CREATE_SKILL_ENDPOINT = createSkillUrl;
    const skillForm = document.getElementById('universal-form');

    // Read a cookie value, used to get the CSRF token
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Send the form data to the server
    async function addSkill(event) {
        event.preventDefault();

        const submitButton = skillForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        try {
            const response = await fetch(CREATE_SKILL_ENDPOINT, {
                method: 'POST',
                headers: { 'X-CSRFToken': getCookie('csrftoken') },
                body: new FormData(skillForm),
            });
            const result = await response.json().catch(() => ({}));

            if (response.ok) {
                skillForm.reset();
                closeSkillModal();
                showToast('Success', 'New skill added successfully!', 'success');
                fetchSkills(searchInput.value.trim());
            } else {
                const errorMessages = result.errors
                    ? Object.values(result.errors).flat().map(error => error.message)
                    : [result.message || `Something went wrong (status ${response.status}).`];
                showToast('Failed to add skill', errorMessages.join(' '), 'error');
            }
        } catch (error) {
            console.error('Error adding skill:', error);
            showToast('Failed to add skill', 'Could not reach the server. Please try again.', 'error');
        } finally {
            submitButton.disabled = false;
        }
    }

    if (skillForm) {
        skillForm.addEventListener('submit', addSkill);
    }
    // Start the application
    fetchSkills(searchInput.value.trim());
