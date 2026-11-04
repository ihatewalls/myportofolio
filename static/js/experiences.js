    const { experiencesUrl, detailUrl, starUrl, loginUrl, editAccess, superAccess, authenticated } = window.APP_CONFIG;
    const PLACEHOLDER = '00000000-0000-0000-0000-000000000000';
    const BASE_EXPERIENCES_ENDPOINT = experiencesUrl;
    const EDIT_ACCESS = editAccess;
    const DETAIL_EXPERIENCE_ENDPOINT = detailUrl;
    const STAR_EXPERIENCE_ENDPOINT = starUrl;
    const IS_SUPERUSER = superAccess;
    const IS_AUTHENTICATED = authenticated;

    let experiencesAbortController;

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
    function escapeHtml(value) {
        return String(value ?? '').replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;').replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
    }
    function getCookie(name) {
        const prefix = `${name}=`;
        const cookie = document.cookie.split(';').map(value => value.trim())
            .find(value => value.startsWith(prefix));
        return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
    }
    function experienceEndpoint(pattern, id) {
        return pattern.replace(PLACEHOLDER, id);
    }
    // Build a experience card element
    function buildExperienceCardElement(experience) {

        const article = document.createElement('article');
        article.className = 'universal-card';


        const star = IS_AUTHENTICATED
        ? `<button type="button" class="button button-star${experience.is_starred ? ' is-starred' : ''}"
            data-action="star" data-id="${escapeHtml(experience.id)}"
            title="${escapeHtml(experience.starred_by_names)}">
            ${experience.is_starred ? 'Unstar' : 'Star'} (${experience.star_count})</button>`
        : `<a href="${loginUrl}" class="button">Login to star (${experience.star_count})</a>`;

        const remove = IS_SUPERUSER
        ? `<button type="button" class="button button-danger" data-action="delete"
            data-id="${escapeHtml(experience.id)}">Delete</button>` : '';

        article.innerHTML = `<h2>${escapeHtml(experience.title)}</h2>
            <span class="universal-category">${escapeHtml(experience.category)}</span>
            <p class="universal-description">${escapeHtml(experience.description)}</p>
            <div class="universal-card-actions"><div class="universal-actions">
            ${star}${remove}</div></div>`;
        return article;
    }

    // Fetch experience data
    async function fetchExperiences(searchQuery = "") {
        if (experiencesAbortController) experiencesAbortController.abort();
        experiencesAbortController = new AbortController();

        try {
            displayPageSection({ showLoading: true });
            const url = new URL(BASE_EXPERIENCES_ENDPOINT, window.location.origin);
            if (searchQuery) url.searchParams.set('title', searchQuery);
            const response = await fetch(url, {
                headers: { Accept: 'application/json' },
                signal: experiencesAbortController.signal,
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const experiences = await response.json();
            gridContainer.replaceChildren(...experiences.map(buildExperienceCardElement));
            displayPageSection({ showGrid: experiences.length > 0, showEmpty: experiences.length === 0 });
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error('Error loading experiences:', error);
            displayPageSection({ showError: true });
        }
    }

    function apiErrorMessage(data, status) {
        const messages = Object.values(data).flat().filter(value => typeof value === 'string');
        return messages.join(' ') || `Request failed (HTTP ${status}).`;
    }
    async function writeExperience(url, method, payload) {
        const response = await fetch(url, {
            method,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: payload === undefined ? undefined : JSON.stringify(payload),
        });
        if (response.status === 204) return null;
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(apiErrorMessage(data, response.status));
        return data;
    }
    function closeExperienceModal() {
        document.getElementById("add-experience-modal").hidePopover();
    }
    const experienceForm = document.getElementById('universal-form');
    async function addExperience(event) {
        event.preventDefault();

        const submitButton = experienceForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        try {
            const fields = new FormData(experienceForm);
            const payload = Object.fromEntries([
                'title', 'description', 'category',
            ].map(name => [name, fields.get(name)]));
            await writeExperience(BASE_EXPERIENCES_ENDPOINT, 'POST', payload);
            experienceForm.reset();
            document.getElementById('add-experience-modal').hidePopover();
            showToast('Success', 'Experience created.', 'success');
            await fetchExperiences(searchInput.value.trim());
        } catch (error) {
            showToast('Could not create experience', error.message, 'error');
        } finally {
            submitButton.disabled = false;
        }
    }

    if (experienceForm) {
        experienceForm.addEventListener('submit', addExperience);
    }
    gridContainer.addEventListener('click', async function(event) {
        const button = event.target.closest('button[data-action]');
        if (!button || button.disabled) return;
        const action = button.dataset.action;
        if (action === 'delete' && !window.confirm('Delete this experience?')) return;
        button.disabled = true;
        try {
            const pattern = action === 'star' ? STAR_EXPERIENCE_ENDPOINT : DETAIL_EXPERIENCE_ENDPOINT;
            await writeExperience(experienceEndpoint(pattern, button.dataset.id),
                action === 'star' ? 'POST' : 'DELETE');
            showToast('Success', action === 'star' ? 'Star updated.' : 'Experience deleted.', 'success');
            await fetchExperiences(searchInput.value.trim());
        } catch (error) {
            showToast('Request failed', error.message, 'error');
        } finally {
            button.disabled = false;
        }
    });
    searchInput.addEventListener('input', function() {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => fetchExperiences(searchInput.value.trim()), 300);
    });
    searchForm.addEventListener('submit', function(event) {
        event.preventDefault();
        clearTimeout(searchDebounceTimer);
        fetchExperiences(searchInput.value.trim());
    });
    fetchExperiences(searchInput.value.trim());
