const CONTENT_FILE = "content.md";

const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeHTML(value = "") {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character],
  );
}

function parseMarkdown(markdown) {
  const content = {
    title: "",
    sections: new Map(),
    watches: [],
  };
  let currentSection = null;

  markdown
    .replace(/\r/g, "")
    .split("\n")
    .forEach((line) => {
      const siteTitle = line.match(/^#\s+(.+)$/);
      const sectionHeading = line.match(/^##\s+(.+)$/);
      const field = line.match(/^-\s+\*\*(.+?):\*\*\s*(.*)$/);

      if (siteTitle && !line.startsWith("##")) {
        content.title = siteTitle[1].trim();
        return;
      }

      if (sectionHeading) {
        const heading = sectionHeading[1].trim();
        currentSection = {
          heading,
          key: slugify(heading),
          fields: new Map(),
          entries: [],
        };
        content.sections.set(currentSection.key, currentSection);
        if (heading.toLowerCase().startsWith("watch:")) {
          content.watches.push(currentSection);
        }
        return;
      }

      if (field && currentSection) {
        const rawKey = field[1].trim();
        const value = field[2].trim();
        const key = slugify(rawKey);
        currentSection.fields.set(key, value);
        currentSection.entries.push({ rawKey, key, value });
      }
    });

  content.watches.sort(
    (a, b) =>
      Number(a.fields.get("order") || 0) - Number(b.fields.get("order") || 0),
  );

  return content;
}

function getSection(content, sectionName) {
  return content.sections.get(slugify(sectionName));
}

function getField(content, path, fallback = "") {
  const [sectionName, ...fieldParts] = path.split(".");
  const section = getSection(content, sectionName);
  return section?.fields.get(slugify(fieldParts.join("."))) || fallback;
}

function watchValue(watch, fieldName, fallback = "") {
  return watch.fields.get(slugify(fieldName)) || fallback;
}

function bindContent(content) {
  qsa("[data-content]").forEach((element) => {
    element.textContent = getField(content, element.dataset.content);
  });

  qsa("[data-href]").forEach((element) => {
    const value = getField(content, element.dataset.href);
    if (value) element.setAttribute("href", value);
  });

  const title = getField(content, "site.meta title");
  const description = getField(content, "site.meta description");
  if (title) document.title = title;
  if (description) qs("[data-meta-description]")?.setAttribute("content", description);
}

function getWatchSpecs(watch) {
  return watch.entries.filter(({ rawKey }) =>
    rawKey.toLowerCase().startsWith("spec "),
  );
}

function getWatchFeatures(watch) {
  return watch.entries.filter(({ rawKey }) =>
    rawKey.toLowerCase().startsWith("feature "),
  );
}

function renderWatch(watch, index, content) {
  const name = watchValue(watch, "Name");
  const watchId = `watch-${slugify(name.replace(/^the\s+/i, ""))}`;
  const accent = watchValue(watch, "Accent", "#1f638f");
  const accentSoft = watchValue(watch, "Accent soft", "#dbe9ef");
  const specsLabel = getField(content, "collection.specs label", "Key specifications");
  const featuresLabel = getField(content, "collection.features label", "Made to stand out");
  const imageLabel = getField(content, "collection.image label", "View full image");
  const number = String(index + 1).padStart(2, "0");

  const specs = getWatchSpecs(watch)
    .map(
      ({ rawKey, value }) => `
        <div>
          <dt>${escapeHTML(rawKey.replace(/^spec\s+/i, ""))}</dt>
          <dd>${escapeHTML(value)}</dd>
        </div>`,
    )
    .join("");

  const features = getWatchFeatures(watch)
    .map(
      ({ value }) => `
        <li>
          <span aria-hidden="true">✓</span>
          ${escapeHTML(value)}
        </li>`,
    )
    .join("");

  return `
    <article
      class="watch"
      id="${watchId}"
      style="--watch-accent: ${escapeHTML(accent)}; --watch-soft: ${escapeHTML(accentSoft)}"
    >
      <div class="watch__media" data-reveal>
        <div class="watch__number" aria-hidden="true">${number}</div>
        <button
          class="watch__main-image image-button"
          type="button"
          data-zoom-image="${escapeHTML(watchValue(watch, "Main image"))}"
          data-zoom-alt="${escapeHTML(watchValue(watch, "Main image alt"))}"
          data-zoom-caption="${escapeHTML(name)}"
        >
          <img
            src="${escapeHTML(watchValue(watch, "Main image"))}"
            alt="${escapeHTML(watchValue(watch, "Main image alt"))}"
            width="752"
            height="754"
            loading="lazy"
          >
          <span>${escapeHTML(imageLabel)} <b aria-hidden="true">↗</b></span>
        </button>
        <button
          class="watch__detail-image image-button"
          type="button"
          data-zoom-image="${escapeHTML(watchValue(watch, "Detail image"))}"
          data-zoom-alt="${escapeHTML(watchValue(watch, "Detail image alt"))}"
          data-zoom-caption="${escapeHTML(name)} · detail"
        >
          <img
            src="${escapeHTML(watchValue(watch, "Detail image"))}"
            alt="${escapeHTML(watchValue(watch, "Detail image alt"))}"
            width="502"
            height="507"
            loading="lazy"
          >
        </button>
        <span class="watch__accent-line" aria-hidden="true"></span>
      </div>

      <div class="watch__copy" data-reveal>
        <p class="eyebrow">${number} · ${escapeHTML(watchValue(watch, "Model"))}</p>
        <h3>${escapeHTML(name)}</h3>
        <p class="watch__tagline">${escapeHTML(watchValue(watch, "Tagline"))}</p>
        <p class="watch__description">${escapeHTML(watchValue(watch, "Description"))}</p>

        <div class="watch__price">
          <strong>${escapeHTML(watchValue(watch, "Price"))}</strong>
          <span>${escapeHTML(watchValue(watch, "Price note"))}</span>
        </div>

        <div class="watch__specs">
          <h4>${escapeHTML(specsLabel)}</h4>
          <dl>${specs}</dl>
        </div>

        <div class="watch__features">
          <h4>${escapeHTML(featuresLabel)}</h4>
          <ul>${features}</ul>
        </div>

        <a
          class="button button--watch"
          href="${escapeHTML(watchValue(watch, "CTA URL"))}"
        >
          ${escapeHTML(watchValue(watch, "CTA label"))}
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </article>`;
}

function renderWatches(content) {
  const list = qs("[data-watch-list]");
  if (!list) return;
  list.innerHTML = content.watches
    .map((watch, index) => renderWatch(watch, index, content))
    .join("");
}

function renderHeroSelector(content) {
  const selector = qs("[data-hero-selector]");
  if (!selector || !content.watches.length) return;

  selector.innerHTML = content.watches
    .map((watch, index) => {
      const name = watchValue(watch, "Name").replace(/^the\s+/i, "");
      return `
        <button
          type="button"
          role="tab"
          aria-selected="${index === 0}"
          data-hero-option="${index}"
        >
          <span>${String(index + 1).padStart(2, "0")}</span>
          <strong>${escapeHTML(name)}</strong>
        </button>`;
    })
    .join("");

  const image = qs("[data-hero-image]");
  const count = qs("[data-hero-count]");
  const model = qs("[data-hero-model]");
  const name = qs("[data-hero-name]");
  const visual = qs("[data-hero-visual]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function chooseWatch(index, immediate = false) {
    const watch = content.watches[index];
    if (!watch) return;

    qsa("[data-hero-option]", selector).forEach((button, buttonIndex) => {
      button.setAttribute("aria-selected", buttonIndex === index ? "true" : "false");
    });

    const update = () => {
      image.src = watchValue(watch, "Main image");
      image.alt = watchValue(watch, "Main image alt");
      count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(content.watches.length).padStart(2, "0")}`;
      model.textContent = watchValue(watch, "Model");
      name.textContent = watchValue(watch, "Name");
      visual.style.setProperty("--hero-accent", watchValue(watch, "Accent", "#e45a2f"));
      visual.classList.remove("is-switching");
    };

    if (immediate || reduceMotion || !image.src) {
      update();
      return;
    }

    visual.classList.add("is-switching");
    window.setTimeout(update, 180);
  }

  qsa("[data-hero-option]", selector).forEach((button) => {
    button.addEventListener("click", () => chooseWatch(Number(button.dataset.heroOption)));
  });

  chooseWatch(0, true);
}

function renderMarquee(content) {
  const track = qs("[data-marquee-track]");
  if (!track) return;
  const message = getField(content, "announcement.text");
  track.innerHTML = Array.from(
    { length: 5 },
    () => `<span>${escapeHTML(message)} <b aria-hidden="true">✦</b></span>`,
  ).join("");
}

function renderStoryGallery(content) {
  const gallery = qs("[data-story-gallery]");
  if (!gallery) return;

  gallery.innerHTML = content.watches
    .map(
      (watch, index) => `
        <figure class="story__image story__image--${index + 1}">
          <img
            src="${escapeHTML(watchValue(watch, "Detail image"))}"
            alt="${escapeHTML(watchValue(watch, "Detail image alt"))}"
            width="502"
            height="507"
            loading="lazy"
          >
          <figcaption>${escapeHTML(watchValue(watch, "Name"))}</figcaption>
        </figure>`,
    )
    .join("");
}

function renderCraft(content) {
  const section = getSection(content, "Craft");
  const grid = qs("[data-craft-grid]");
  if (!section || !grid) return;

  const cards = [1, 2, 3, 4]
    .map((number) => ({
      title: section.fields.get(`pillar-${number}-title`),
      body: section.fields.get(`pillar-${number}-body`),
    }))
    .filter(({ title }) => title);

  grid.innerHTML = cards
    .map(
      ({ title, body }, index) => `
        <article class="craft-card" data-reveal>
          <span>${String(index + 1).padStart(2, "0")}</span>
          <div class="craft-card__icon" aria-hidden="true">
            ${["◇", "≋", "○", "＋"][index] || "◇"}
          </div>
          <h3>${escapeHTML(title)}</h3>
          <p>${escapeHTML(body || "")}</p>
        </article>`,
    )
    .join("");
}

function renderFaq(content) {
  const section = getSection(content, "FAQ");
  const list = qs("[data-faq-list]");
  if (!section || !list) return;

  const questions = [1, 2, 3, 4, 5, 6]
    .map((number) => ({
      question: section.fields.get(`question-${number}`),
      answer: section.fields.get(`answer-${number}`),
    }))
    .filter(({ question }) => question);

  list.innerHTML = questions
    .map(
      ({ question, answer }, index) => `
        <details${index === 0 ? " open" : ""}>
          <summary>
            <span>${escapeHTML(question)}</span>
            <b aria-hidden="true"></b>
          </summary>
          <p>${escapeHTML(answer || "")}</p>
        </details>`,
    )
    .join("");
}

function setupImageDialog() {
  const dialog = qs("[data-image-dialog]");
  const dialogImage = qs("[data-dialog-image]");
  const caption = qs("[data-dialog-caption]");
  const close = qs("[data-dialog-close]");
  if (!dialog || !dialogImage || !caption || !close) return;

  qsa("[data-zoom-image]").forEach((button) => {
    button.addEventListener("click", () => {
      dialogImage.src = button.dataset.zoomImage;
      dialogImage.alt = button.dataset.zoomAlt;
      caption.textContent = button.dataset.zoomCaption;
      dialog.showModal();
    });
  });

  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

function setupNavigation() {
  const header = qs("[data-site-header]");
  const toggle = qs("[data-menu-toggle]");
  const nav = qs("[data-site-nav]");
  if (!header || !toggle || !nav) return;

  const closeMenu = () => {
    toggle.setAttribute("aria-expanded", "false");
    qs(".sr-only", toggle).textContent = "Open menu";
    header.classList.remove("menu-open");
    document.body.classList.remove("nav-open");
  };

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isOpen));
    qs(".sr-only", toggle).textContent = isOpen ? "Open menu" : "Close menu";
    header.classList.toggle("menu-open", !isOpen);
    document.body.classList.toggle("nav-open", !isOpen);
  });

  qsa("a", nav).forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  const setHeaderState = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  };
  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });
}

function setupRevealAnimations() {
  const elements = qsa("[data-reveal]");
  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !("IntersectionObserver" in window)
  ) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -7% 0px" },
  );

  elements.forEach((element) => observer.observe(element));
}

async function initialise() {
  try {
    const response = await fetch(CONTENT_FILE, { cache: "no-store" });
    if (!response.ok) throw new Error(`Unable to load ${CONTENT_FILE}`);
    const content = parseMarkdown(await response.text());

    bindContent(content);
    renderWatches(content);
    renderHeroSelector(content);
    renderMarquee(content);
    renderStoryGallery(content);
    renderCraft(content);
    renderFaq(content);
    setupImageDialog();
    setupNavigation();
    setupRevealAnimations();
    document.body.classList.add("content-ready");
  } catch (error) {
    console.error(error);
    qs("[data-content-error]")?.removeAttribute("hidden");
    document.body.classList.add("content-ready");
  }
}

initialise();
