    const { skillsUrl, detailUrl,  loginUrl, editAccess, superAccess, authenticated } = window.APP_CONFIG;
    const PLACEHOLDER = '00000000-0000-0000-0000-000000000000'
    const BASE_SKILLS_ENDPOINT = skillsUrl;
    const EDIT_ACCESS = editAccess;
    const DETAIL_SKILL_ENDPOINT = detailUrl;
    const IS_SUPERUSER = superAccess;
    const IS_AUTHENTICATED = authenticated;
    let skillsAbortController;

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
    function skillEndpoint(pattern, id) {
        return pattern.replace(PLACEHOLDER, id);
    }
    // Build a skill card element
    function buildSkillCardElement(skill) {
        const article = document.createElement('article');
        article.className = 'universal-card';

        const remove = IS_SUPERUSER
        ? `<button type="button" class="button button-danger" data-action="delete"
            data-id="${escapeHtml(skill.id)}">Delete</button>` : '';

        article.innerHTML = `<h2>${escapeHtml(skill.title)}</h2>
            <span class="universal-category">${escapeHtml(skill.category)}</span>
            <p class="universal-description">${escapeHtml(skill.description)}</p>
            <div class="universal-card-actions"><div class="universal-actions">
            ${remove}</div></div>`;
        return article;
    }

    // Fetch skill data
    async function fetchSkills(searchQuery = "") {
        if (skillsAbortController) skillsAbortController.abort();
        skillsAbortController = new AbortController();

        try {
            displayPageSection({ showLoading: true });
            const url = new URL(BASE_SKILLS_ENDPOINT, window.location.origin);
            if (searchQuery) url.searchParams.set('title', searchQuery);
            const response = await fetch(url, {
                headers: { Accept: 'application/json' },
                signal: skillsAbortController.signal,
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const skills = await response.json();
            gridContainer.replaceChildren(...skills.map(buildSkillCardElement));
            displayPageSection({ showGrid: skills.length > 0, showEmpty: skills.length === 0 });
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error('Error loading skills:', error);
            displayPageSection({ showError: true });
        }
    }
    function apiErrorMessage(data, status) {
        const messages = Object.values(data).flat().filter(value => typeof value === 'string');
        return messages.join(' ') || `Request failed (HTTP ${status}).`;
    }
    async function writeSkill(url, method, payload) {
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
    function closeSkillModal() {
        document.getElementById("add-skill-modal").hidePopover();
    }
    const skillForm = document.getElementById('universal-form');

    // Send the form data to the server
    async function addSkill(event) {
        event.preventDefault();

        const submitButton = skillForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        try {
            const fields = new FormData(skillForm);
            const payload = Object.fromEntries([
                'title', 'description', 'category',
            ].map(name => [name, fields.get(name)]));
            await writeSkill(BASE_SKILLS_ENDPOINT, 'POST', payload);
            skillForm.reset();
            document.getElementById('add-skill-modal').hidePopover();
            showToast('Success', 'Skill created.', 'success');
            await fetchSkills(searchInput.value.trim());
        } catch (error) {
            showToast('Could not create skill', error.message, 'error');
        } finally {
            submitButton.disabled = false;
        }
    }

    if (skillForm) {
        skillForm.addEventListener('submit', addSkill);
    }
    gridContainer.addEventListener('click', async function(event) {
        const button = event.target.closest('button[data-action]');
        if (!button || button.disabled) return;
        const action = button.dataset.action;
        if (action === 'delete' && !window.confirm('Delete this skill?')) return;
        button.disabled = true;
        try {
            const pattern = action === DETAIL_SKILL_ENDPOINT;
            await writeSkill(skillEndpoint(pattern, button.dataset.id), 'DELETE');
            showToast('Success', 'Skill deleted.', 'success');
            await fetchSkills(searchInput.value.trim());
        } catch (error) {
            showToast('Request failed', error.message, 'error');
        } finally {
            button.disabled = false;
        }
    });
    searchInput.addEventListener('input', function() {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => fetchSkills(searchInput.value.trim()), 300);
    });
    searchForm.addEventListener('submit', function(event) {
        event.preventDefault();
        clearTimeout(searchDebounceTimer);
        fetchSkills(searchInput.value.trim());
    });
    // Start the application
    fetchSkills(searchInput.value.trim());
