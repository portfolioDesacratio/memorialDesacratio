/**
 * CyberDesacratio — все скрипты
 * темы, частицы, модули, модалки, поиск, фильтр,
 * статьи, прогресс-бар, кнопка наверх, scroll reveal
 */

// ========== ТРОТТЛ ==========
function throttle(fn, limit) {
    let last = 0;
    return function(...args) {
        const now = Date.now();
        if (now - last >= limit) { last = now; fn.apply(this, args); }
    };
}

// ========== ПЕРЕКЛЮЧЕНИЕ ТЕМЫ ==========
const themeToggle = document.getElementById('themeToggle');
let currentTheme = localStorage.getItem('mTheme') || 'dark';

function applyTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light-mode');
        themeToggle.textContent = '☀️';
    } else {
        document.body.classList.remove('light-mode');
        themeToggle.textContent = '🌙';
    }
    localStorage.setItem('mTheme', theme);
    currentTheme = theme;
    if (typeof drawParticles === 'function') setTimeout(drawParticles, 50);
}

applyTheme(currentTheme);

themeToggle.addEventListener('click', () => {
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

// ========== БУРГЕР-МЕНЮ ==========
const burgerBtn = document.getElementById('burgerBtn');
const navLinks = document.getElementById('navLinks');

burgerBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    burgerBtn.classList.toggle('active');
});

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        burgerBtn.classList.remove('active');
    });
});

// ========== ПЛАВНЫЙ СКРОЛЛ ==========
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            const offset = 80;
            const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});

// ====================================================================
// МОДУЛИ
// ====================================================================
const moduleGrid = document.getElementById('moduleGrid');
const moduleModal = document.getElementById('moduleModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalBack = document.getElementById('modalBack');
const modalClose = moduleModal.querySelector('.modal-close');
const modalProgressBar = document.getElementById('modalProgressBar');

let currentModule = null;
let currentSubmodule = null;
let activeFilter = null;

// Рендер модулей с учётом фильтра
function renderModules(filterCategory) {
    moduleGrid.innerHTML = '';
    let modules = MODULES;
    if (filterCategory) {
        modules = MODULES.filter(m => m.title === filterCategory);
    }
    modules.forEach(mod => {
        const card = document.createElement('button');
        card.className = 'library-card';
        card.dataset.category = mod.title;
        card.innerHTML = `
            <div class="card-icon">${mod.icon}</div>
            <h3>${mod.title}</h3>
            <p>${mod.desc}</p>
            <span class="card-count">${mod.count} подмодулей</span>
            <span class="card-tag">Открыть модуль →</span>
        `;
        card.addEventListener('click', () => openModule(mod));
        moduleGrid.appendChild(card);
    });
}

// Открыть модуль (список подмодулей)
function openModule(mod) {
    currentModule = mod;
    currentSubmodule = null;
    modalTitle.textContent = `${mod.icon} ${mod.title}`;
    modalBack.style.display = 'none';

    let html = `<div class="submodule-grid">`;
    mod.submodules.forEach((sub, i) => {
        html += `
            <button class="submodule-card" data-index="${i}">
                <span class="submodule-title">${sub.title}</span>
                <span class="submodule-arrow">→</span>
            </button>
        `;
    });
    html += `</div>`;
    modalBody.innerHTML = html;

    modalBody.querySelectorAll('.submodule-card').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index);
            openSubmodule(mod, idx);
        });
    });

    moduleModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    resetProgress();
}

// Открыть подмодуль (контент)
function openSubmodule(mod, idx, searchQuery) {
    currentSubmodule = idx;
    const sub = mod.submodules[idx];
    modalTitle.textContent = `${mod.icon} ${sub.title}`;
    modalBack.style.display = 'flex';
    modalBody.innerHTML = sub.content;

    // Если есть поисковый запрос — подсвечиваем слова в контенте
    if (searchQuery && searchQuery.length > 0) {
        highlightInContent(modalBody, searchQuery);
    }

    // Показываем модал (если вызвано напрямую из поиска)
    moduleModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Scroll to top and reset progress
    moduleModal.querySelector('.modal').scrollTop = 0;
    resetProgress();
}

// Подсветка найденного слова в HTML-контенте
function highlightInContent(container, query) {
    const q = query.toLowerCase();
    // Обходим все текстовые узлы внутри контейнера (но не внутри <script>, <style>, <code>, <pre>)
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode: function(node) {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_ACCEPT;
            const tag = parent.tagName;
            if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'CODE' || tag === 'PRE') {
                return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
        }
    });

    const toReplace = [];
    let node;
    while (node = walker.nextNode()) {
        const text = node.textContent;
        const lower = text.toLowerCase();
        let idx = lower.indexOf(q);
        if (idx === -1) continue;
        toReplace.push({ node, text, idx });
    }

    // Заменяем с конца, чтобы не сбивались индексы
    for (let i = toReplace.length - 1; i >= 0; i--) {
        const { node, text, idx } = toReplace[i];
        const before = text.substring(0, idx);
        const match = text.substring(idx, idx + query.length);
        const after = text.substring(idx + query.length);

        const span = document.createElement('span');
        span.className = 'search-highlight';
        span.textContent = match;

        const frag = document.createDocumentFragment();
        if (before) frag.appendChild(document.createTextNode(before));
        frag.appendChild(span);
        if (after) frag.appendChild(document.createTextNode(after));
        node.parentNode.replaceChild(frag, node);
    }

    // Если есть выделения — скроллим к первому
    const first = container.querySelector('.search-highlight');
    if (first) {
        setTimeout(() => {
            first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }
}

// Закрытие модала
function closeModal() {
    moduleModal.classList.remove('active');
    document.body.style.overflow = '';
    currentModule = null;
    currentSubmodule = null;
    resetProgress();
}

// Назад к подмодулям
modalBack.addEventListener('click', () => {
    if (currentModule && currentSubmodule !== null) {
        openModule(currentModule);
    }
});

modalClose.addEventListener('click', closeModal);
moduleModal.addEventListener('click', (e) => {
    if (e.target === moduleModal) closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ========== PROGRESS BAR ЧТЕНИЯ ==========
function resetProgress() {
    if (modalProgressBar) modalProgressBar.style.width = '0%';
}

const modalElement = moduleModal ? moduleModal.querySelector('.modal') : null;
if (modalElement) {
    modalElement.addEventListener('scroll', throttle(() => {
        if (currentSubmodule === null) return;
        const el = modalElement;
        const scrollTop = el.scrollTop;
        const scrollHeight = el.scrollHeight - el.clientHeight;
        if (scrollHeight <= 0) return;
        const percent = Math.min(100, Math.round((scrollTop / scrollHeight) * 100));
        if (modalProgressBar) modalProgressBar.style.width = percent + '%';
    }, 50));
}

// ====================================================================
// ФИЛЬТР ПО КАТЕГОРИЯМ
// ====================================================================
const filterList = document.getElementById('filterList');
const filterReset = document.getElementById('filterReset');

function buildFilter() {
    if (!filterList) return;
    const categories = MODULES.map(m => ({
        title: m.title,
        icon: m.icon,
        count: m.count
    }));
    filterList.innerHTML = '';
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn' + (activeFilter === cat.title ? ' active' : '');
        btn.innerHTML = `
            <span class="filter-icon">${cat.icon}</span>
            <span class="filter-name">${cat.title}</span>
            <span class="filter-count">${cat.count}</span>
        `;
        btn.addEventListener('click', () => {
            if (activeFilter === cat.title) {
                activeFilter = null;
            } else {
                activeFilter = cat.title;
            }
            updateFilterUI();
            renderModules(activeFilter);
        });
        filterList.appendChild(btn);
    });
    updateFilterUI();
}

function updateFilterUI() {
    filterList.querySelectorAll('.filter-btn').forEach(btn => {
        const title = btn.querySelector('.filter-name').textContent;
        btn.classList.toggle('active', activeFilter === title);
    });
    if (filterReset) {
        filterReset.classList.toggle('visible', activeFilter !== null);
    }
}

if (filterReset) {
    filterReset.addEventListener('click', () => {
        activeFilter = null;
        updateFilterUI();
        renderModules(null);
    });
}

// ====================================================================
// ПОИСК ПО МОДУЛЯМ И ПОДМОДУЛЯМ
// ====================================================================
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

// Построить поисковый индекс
let searchIndex = [];
function buildSearchIndex() {
    searchIndex = [];
    MODULES.forEach(mod => {
        mod.submodules.forEach((sub, idx) => {
            // Извлекаем чистый текст из HTML-контента
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = sub.content;
            const plainText = tempDiv.textContent || '';
            searchIndex.push({
                moduleTitle: mod.title,
                moduleIcon: mod.icon,
                subTitle: sub.title,
                subIndex: idx,
                modRef: mod,
                text: (sub.title + ' ' + plainText).toLowerCase(),
                preview: plainText.substring(0, 200)
            });
        });
    });
}

function performSearch(query) {
    if (!query || query.length < 2) {
        searchResults.classList.remove('active');
        return;
    }
    const q = query.toLowerCase();
    const LIMIT = 12;
    let results = [];
    for (const item of searchIndex) {
        if (results.length >= LIMIT) break;
        if (item.text.includes(q)) {
            results.push(item);
        }
    }
    renderSearchResults(results, q);
}

function renderSearchResults(results, q) {
    searchResults.innerHTML = '';
    if (results.length === 0) {
        searchResults.innerHTML = `<div class="search-no-results">Ничего не найдено</div>`;
        searchResults.classList.add('active');
        return;
    }
    results.forEach(r => {
        // Находим контекст с подсветкой
        const idx = r.text.indexOf(q);
        let matchText = '';
        if (idx >= 0) {
            const start = Math.max(0, idx - 40);
            const end = Math.min(r.text.length, idx + q.length + 60);
            let snippet = r.text.substring(start, end);
            // Подсвечиваем
            const qIdx = snippet.indexOf(q);
            if (qIdx >= 0) {
                matchText = '…' + snippet.substring(0, qIdx) +
                    '<mark>' + snippet.substring(qIdx, qIdx + q.length) + '</mark>' +
                    snippet.substring(qIdx + q.length) + '…';
            } else {
                matchText = '…' + snippet + '…';
            }
        }
        const btn = document.createElement('button');
        btn.className = 'search-result-item';
        btn.innerHTML = `
            <span class="result-module">${r.moduleIcon} ${r.moduleTitle}</span>
            <span class="result-title">${r.subTitle}</span>
            <span class="result-match">${matchText}</span>
        `;
        btn.addEventListener('click', () => {
            searchResults.classList.remove('active');
            searchInput.value = '';
            openSubmodule(r.modRef, r.subIndex, q);
        });
        searchResults.appendChild(btn);
    });
    searchResults.classList.add('active');
}

if (searchInput) {
    searchInput.addEventListener('input', throttle(function() {
        performSearch(this.value.trim());
    }, 200));

    // Закрыть поиск при клике вне
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.hero-search')) {
            searchResults.classList.remove('active');
        }
    });

    // Закрыть по Escape
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchResults.classList.remove('active');
            searchInput.blur();
        }
        if (e.key === 'Enter') {
            // Открыть первый результат
            const first = searchResults.querySelector('.search-result-item');
            if (first) first.click();
        }
    });
}

// ====================================================================
// СТАТЬИ — загрузка, хранение, просмотр
// ====================================================================
const articlesGrid = document.getElementById('articlesGrid');
const articlesEmpty = document.getElementById('articlesEmpty');
const fileInput = document.getElementById('fileInput');
const articlesUpload = document.getElementById('articlesUpload');

let articles = [];

// Загрузить статьи из localStorage + статические из data.js
function loadArticles() {
    const local = [];
    try {
        const saved = localStorage.getItem('mArticles');
        if (saved) local.push(...JSON.parse(saved));
    } catch(e) { /* ignore */ }

    // Статические статьи из data.js (помечаем флагом static)
    const staticArts = (typeof STATIC_ARTICLES !== 'undefined' && Array.isArray(STATIC_ARTICLES))
        ? STATIC_ARTICLES.map(a => ({ ...a, static: true }))
        : [];

    // Объединяем: сначала статические, потом из localStorage
    articles = [...staticArts, ...local];
}

// Сохранить статьи (только нестатические — статические живут в data.js)
function saveArticles() {
    const toSave = articles.filter(a => !a.static);
    try {
        localStorage.setItem('mArticles', JSON.stringify(toSave));
    } catch(e) {
        // Если localStorage переполнен, удаляем самые старые
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            while (toSave.length > 0) {
                toSave.shift();
                try {
                    localStorage.setItem('mArticles', JSON.stringify(toSave));
                    break;
                } catch(e2) { continue; }
            }
        }
    }
}

// Рендер статей
function renderArticles() {
    if (!articlesGrid || !articlesEmpty) return;
    articlesGrid.innerHTML = '';
    if (articles.length === 0) {
        articlesEmpty.classList.remove('hidden');
        return;
    }
    articlesEmpty.classList.add('hidden');
    // Сортируем от новых к старым
    const sorted = [...articles].reverse();
    sorted.forEach((art, displayIdx) => {
        const realIdx = articles.length - 1 - displayIdx;
        const card = document.createElement('div');
        card.className = 'article-card';
        const preview = art.content.replace(/<[^>]*>/g, '').substring(0, 150);
        const isStatic = art.static === true;
        // Кнопка удаления — только в админ-режиме и только для нестатических статей
        const showDelete = !isStatic && adminMode;
        card.innerHTML = `
            <span class="article-type">${art.type}</span>
            ${showDelete ? `<button class="article-delete" data-index="${realIdx}" aria-label="Удалить статью">✕</button>` : ''}
            <h3>${escHtml(art.title)}</h3>
            <div class="article-date">${art.date}</div>
            <div class="article-preview">${escHtml(preview)}</div>
        `;
        card.addEventListener('click', (e) => {
            if (e.target.closest('.article-delete')) return;
            openArticle(realIdx);
        });
        // Кнопка удаления
        const delBtn = card.querySelector('.article-delete');
        if (delBtn) {
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteArticle(realIdx);
            });
        }
        articlesGrid.appendChild(card);
    });
}

function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Удалить статью
function deleteArticle(idx) {
    if (idx < 0 || idx >= articles.length) return;
    articles.splice(idx, 1);
    saveArticles();
    renderArticles();
}

// Открыть статью
function openArticle(idx) {
    const art = articles[idx];
    if (!art) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.style.display = 'flex';

    let contentHtml = '';
    if (art.type === 'PDF') {
        // Для PDF показываем встроенный просмотрщик с blob URL
        contentHtml = `<div style="width:100%;height:80vh;border-radius:12px;overflow:hidden;">
            <iframe src="${art.blobUrl || ''}" style="width:100%;height:100%;border:none;" allowfullscreen></iframe>
        </div>`;
    } else {
        contentHtml = `<div class="article-viewer-content">${art.content}</div>`;
    }

    overlay.innerHTML = `
        <div class="modal article-viewer" style="max-width:800px;">
            <div class="article-viewer-header">
                <h2>${escHtml(art.title)}</h2>
                <button class="modal-close" aria-label="Закрыть">&times;</button>
            </div>
            ${contentHtml}
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // Анимация появления
    requestAnimationFrame(() => overlay.style.opacity = '1');

    overlay.querySelector('.modal-close').addEventListener('click', () => {
        overlay.remove();
        document.body.style.overflow = '';
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
            document.body.style.overflow = '';
        }
    });
    document.addEventListener('keydown', function handler(e) {
        if (e.key === 'Escape') {
            overlay.remove();
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handler);
        }
    });
}

// Форматирование даты
function formatDate() {
    const d = new Date();
    const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// Обработка загруженного файла
function handleFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        alert('Файл слишком большой. Максимум 10MB.');
        return;
    }

    const name = file.name.replace(/\.[^/.]+$/, '');
    const ext = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();

    if (ext === 'pdf') {
        // Для PDF сохраняем как base64
        reader.onload = function(e) {
            const base64 = e.target.result;
            const blobUrl = URL.createObjectURL(file);
            articles.push({
                title: name || 'PDF документ',
                type: 'PDF',
                content: '',
                blobUrl: blobUrl,
                base64: base64,
                date: formatDate()
            });
            saveArticles();
            renderArticles();
        };
        reader.readAsDataURL(file);
    } else if (ext === 'html' || ext === 'htm') {
        reader.onload = function(e) {
            let content = e.target.result;
            // Санитайзим базово: убираем скрипты
            content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
            // Извлекаем title из HTML если есть
            const titleMatch = content.match(/<title[^>]*>([^<]*)<\/title>/i);
            const title = titleMatch ? titleMatch[1].trim() : (name || 'HTML документ');
            articles.push({
                title: title,
                type: 'HTML',
                content: content,
                date: formatDate()
            });
            saveArticles();
            renderArticles();
        };
        reader.readAsText(file, 'UTF-8');
    } else {
        // TXT и прочее
        reader.onload = function(e) {
            let content = e.target.result;
            // Экранируем HTML-спецсимволы для безопасного отображения
            content = content
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
            // Преобразуем переносы строк в <br>
            content = content.replace(/\n/g, '<br>');
            articles.push({
                title: name || 'Текстовый документ',
                type: 'TXT',
                content: content,
                date: formatDate()
            });
            saveArticles();
            renderArticles();
        };
        reader.readAsText(file, 'UTF-8');
    }
}

if (fileInput) {
    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            handleFile(this.files[0]);
        }
        this.value = '';
    });
}

// Drag & drop на кнопку загрузки
if (articlesUpload) {
    articlesUpload.addEventListener('dragover', (e) => {
        e.preventDefault();
        articlesUpload.style.transform = 'scale(1.02)';
    });
    articlesUpload.addEventListener('dragleave', () => {
        articlesUpload.style.transform = '';
    });
    articlesUpload.addEventListener('drop', (e) => {
        e.preventDefault();
        articlesUpload.style.transform = '';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
}

// ====================================================================
// СЧЁТЧИКИ
// ====================================================================
function animateCounter(el, target, suffix = '') {
    let current = 0;
    const step = Math.ceil(target / 50);
    const timer = setInterval(() => {
        current += step;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = current + suffix;
    }, 20);
}

const counterObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
        if (entry.isIntersecting) {
            const el = entry.target;
            const id = el.id;
            if (id === 'articlesCount') animateCounter(el, 108, '+');
            if (id === 'projectsCount') animateCounter(el, 25, '+');
            if (id === 'expYears') animateCounter(el, 3, '+');
            counterObserver.unobserve(el);
        }
    }
}, { threshold: 0.5 });

['articlesCount', 'projectsCount', 'expYears'].forEach(id => {
    const el = document.getElementById(id);
    if (el) counterObserver.observe(el);
});

// ====================================================================
// ЧАСТИЦЫ
// ====================================================================
(function() {
    const canvas = document.getElementById('particlesCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let rafId = null;
    let running = false;
    let lastFrame = 0;
    let currentW = 0, currentH = 0;
    let resizeTimer = null;

    function rand(min, max) { return Math.random() * (max - min) + min; }
    function isMobile() { return window.innerWidth <= 768; }
    function isTiny() { return window.innerWidth <= 480; }
    function particleCount() {
        if (isTiny()) return 40;
        if (isMobile()) return 65;
        return 110;
    }
    function effectiveDPR() {
        const dpr = window.devicePixelRatio || 1;
        return isMobile() ? Math.min(dpr, 2) : Math.min(dpr, 3);
    }

    function createParticle(w, h, fromBottom) {
        const isSmall = isTiny();
        return {
            x: rand(0, w), y: fromBottom ? rand(h + 5, h + 40) : rand(0, h),
            size: rand(isSmall ? 1.2 : 1.5, isSmall ? 2.8 : 3.6),
            alpha: rand(isSmall ? 0.25 : 0.3, isSmall ? 0.55 : 0.7),
            speedY: rand(0.08, 0.25), driftX: rand(-0.12, 0.12),
            phase: rand(0, Math.PI * 2), phaseSpeed: rand(0.003, 0.01),
            sway: rand(0.015, 0.05),
        };
    }

    window.drawParticles = function() { draw(); };

    function resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        if (w === currentW && h === currentH) return;
        currentW = w; currentH = h;
        const dpr = effectiveDPR();
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const num = particleCount();
        const next = [];
        for (let i = 0; i < num; i++) {
            if (particles[i]) next.push(particles[i]);
            else next.push(createParticle(w, h, false));
        }
        particles = next;
    }

    function debouncedResize() {
        if (resizeTimer) { cancelAnimationFrame(resizeTimer); resizeTimer = null; }
        resizeTimer = requestAnimationFrame(resize);
    }

    function draw() {
        const w = window.innerWidth, h = window.innerHeight;
        ctx.clearRect(0, 0, w, h);
        const isLight = document.body.classList.contains('light-mode');
        const color = isLight ? '0,0,0' : '255,255,255';
        const mobile = isMobile();

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.phase += p.phaseSpeed;
            p.x += p.driftX + Math.sin(p.phase) * p.sway;
            p.y -= p.speedY;
            if (p.y + p.size < 0) { particles[i] = createParticle(w, h, true); continue; }
            if (p.x < -10) p.x = w + 10;
            if (p.x > w + 10) p.x = -10;
            ctx.beginPath();
            ctx.fillStyle = `rgba(${color},${p.alpha})`;
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        const linkDist = mobile ? 100 : 170;
        const linkDistSq = linkDist * linkDist;
        const maxLinks = mobile ? 2 : 3;
        for (let i = 0; i < particles.length; i++) {
            const a = particles[i];
            let links = 0;
            for (let j = i + 1; j < particles.length; j++) {
                if (links >= maxLinks) break;
                const b = particles[j];
                const dx = a.x - b.x, dy = a.y - b.y;
                const distSq = dx * dx + dy * dy;
                if (distSq > linkDistSq) continue;
                const strength = 1 - (distSq / linkDistSq);
                const alpha = Math.max(0, (mobile ? 0.35 : 0.5) * strength);
                ctx.beginPath();
                ctx.strokeStyle = `rgba(${color},${alpha})`;
                ctx.lineWidth = mobile ? 0.6 : 1.0;
                ctx.moveTo(a.x, a.y);
                const mx = (a.x + b.x) / 2 + Math.sin(a.phase + b.phase) * 1;
                const my = (a.y + b.y) / 2 + Math.cos(a.phase + b.phase) * 0.8;
                ctx.quadraticCurveTo(mx, my, b.x, b.y);
                ctx.stroke();
                links++;
            }
        }
    }

    function animate(ts) {
        if (!running) return;
        const fps = isMobile() ? 20 : 36;
        const frameMs = 1000 / fps;
        if (!lastFrame || ts - lastFrame >= frameMs) { lastFrame = ts; draw(); }
        rafId = requestAnimationFrame(animate);
    }

    function start() { if (!running) { running = true; rafId = requestAnimationFrame(animate); } }
    function stop() { running = false; if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
    window.addEventListener('resize', debouncedResize);
    resize();
    start();
})();

// ========== ПАРАЛЛАКС ==========
window.addEventListener('scroll', throttle(() => {
    const hero = document.querySelector('.hero-content');
    if (hero) {
        const scrolled = window.pageYOffset;
        const h = window.innerHeight;
        if (scrolled < h) {
            hero.style.transform = `translateY(${scrolled * 0.06}px)`;
            hero.style.opacity = 1 - (scrolled / (h * 0.6));
        }
    }
}, 60));

// ========== ПОДСВЕТКА РАЗДЕЛА ==========
const secs = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', throttle(() => {
    let current = '';
    const scrollY = window.pageYOffset;
    secs.forEach(section => {
        const top = section.offsetTop - 150;
        if (scrollY >= top) current = section.getAttribute('id');
    });
    navAnchors.forEach(a => {
        a.style.color = a.getAttribute('href') === '#' + current ? 'var(--accent)' : '';
    });
}, 80));

// ========== КНОПКА НАВЕРХ ==========
const backToTop = document.getElementById('backToTop');
if (backToTop) {
    window.addEventListener('scroll', throttle(() => {
        if (window.pageYOffset > 400) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }, 100));

    backToTop.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ========== АДМИН-ПАНЕЛЬ (двойной клик по заголовку статей) ==========
const articlesTitle = document.getElementById('articlesTitle');
const adminPanel = document.getElementById('adminPanel');
let adminMode = localStorage.getItem('mAdminMode') === 'true';

function updateAdminUI() {
    if (!adminPanel) return;
    adminPanel.style.display = adminMode ? 'block' : 'none';
    // Перерисовываем статьи — кнопки удаления появляются/исчезают
    renderArticles();
}

if (articlesTitle) {
    articlesTitle.addEventListener('dblclick', (e) => {
        e.preventDefault();
        adminMode = !adminMode;
        localStorage.setItem('mAdminMode', adminMode);
        updateAdminUI();
    });
}

// ====================================================================
// ЗАПУСК
// ====================================================================
renderModules(null);
buildFilter();
buildSearchIndex();
loadArticles();
renderArticles();
if (adminMode) updateAdminUI();

console.log('%c CyberDesacratio ', 'background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; font-size: 18px; padding: 10px 20px; border-radius: 8px; font-weight: bold;');
console.log('%c In Cyberspace We Trust ', 'color: #667eea; font-size: 13px;');
