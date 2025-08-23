// ===== DATA LOADER UTILITY =====

class DataLoader {
  constructor() {
    this.cache = new Map();
    this.loadingStates = new Map();
  }

  async loadData(url, useCache = true) {
    if (useCache && this.cache.has(url)) {
      return this.cache.get(url);
    }

    if (this.loadingStates.has(url)) {
      return this.loadingStates.get(url);
    }

    const loadingPromise = this.fetchData(url);
    this.loadingStates.set(url, loadingPromise);

    try {
      const data = await loadingPromise;

      if (useCache) {
        this.cache.set(url, data);
      }

      this.loadingStates.delete(url);
      return data;
    } catch (error) {
      this.loadingStates.delete(url);
      throw error;
    }
  }

  async fetchData(url) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to load data from ${url}:`, error);
      throw error;
    }
  }

  async loadMultiple(urls, useCache = true) {
    const promises = urls.map((url) => this.loadData(url, useCache));
    return Promise.all(promises);
  }

  async preload(urls) {
    try {
      await this.loadMultiple(urls, true);
      console.log("Data preloaded successfully");
    } catch (error) {
      console.warn("Some data failed to preload:", error);
    }
  }

  clearCache(url = null) {
    if (url) {
      this.cache.delete(url);
    } else {
      this.cache.clear();
    }
  }
}

// Create global data loader instance
const dataLoader = new DataLoader();

// ===== DATA MANAGEMENT =====

// Data Storage - Will be populated from JSON files
let projects = [];
let skills = {};
let education = [];
let jobExperiences = [];

// Data URLs
const DATA_URLS = {
  projects: "data/projects.json",
  skills: "data/skills.json",
  education: "data/education.json",
  experience: "data/experience.json",
};

// Data loading functions
async function loadAllData() {
  console.log("Loading portfolio data...");

  const [projectsData, skillsData, educationData, experienceData] =
    await dataLoader.loadMultiple([
      DATA_URLS.projects,
      DATA_URLS.skills,
      DATA_URLS.education,
      DATA_URLS.experience,
    ]);

  // Update global variables
  projects = projectsData || [];
  skills = skillsData || {};
  education = educationData || [];
  jobExperiences = experienceData || [];

  console.log("Portfolio data loaded successfully");
}

// Individual data loading functions for specific sections
async function loadProjectsData() {
  projects = await dataLoader.loadData(DATA_URLS.projects);
  return projects;
}

async function loadSkillsData() {
  skills = await dataLoader.loadData(DATA_URLS.skills);
  return skills;
}

async function loadEducationData() {
  education = await dataLoader.loadData(DATA_URLS.education);
  return education;
}

async function loadExperienceData() {
  jobExperiences = await dataLoader.loadData(DATA_URLS.experience);
  return jobExperiences;
}

// Function to create timeline item HTML
function createTimelineItem(job, index) {
  const isLeft = index % 2 === 0;
  const positionClass = isLeft ? "timeline-item--left" : "timeline-item--right";

  const technologiesHTML = job.technologies
    .map((tech) => `<span class="tech-tag" role="listitem">${tech}</span>`)
    .join("");

  return `
    <div class="timeline-item ${positionClass}" role="listitem">
      <div class="timeline-node" aria-hidden="true"></div>
      <article class="job-card">
        <h3 class="job-title">${job.position}</h3>
        <h4 class="company-name">${job.company}</h4>
        <p class="job-duration">
          <time datetime="${job.startDate}">${job.startDate}</time> - 
          <time datetime="${
            job.endDate === "Present"
              ? new Date().toISOString().slice(0, 7)
              : job.endDate
          }">${job.endDate}</time>
        </p>
        <p class="job-description">${job.description}</p>
        <div class="job-technologies" role="list" aria-label="Technologies used">
          ${technologiesHTML}
        </div>
      </article>
    </div>
  `;
}

// Function to render timeline
async function renderTimeline() {
  const timelineContainer = document.querySelector(".timeline-container");

  if (!timelineContainer) {
    console.error("Timeline container not found");
    return;
  }

  // Load experience data if not already loaded
  if (jobExperiences.length === 0) {
    await loadExperienceData();
  }

  // Clear existing content
  timelineContainer.innerHTML = "";

  // Generate timeline items from job data
  const timelineHTML = jobExperiences
    .map((job, index) => createTimelineItem(job, index))
    .join("");

  // Insert generated HTML
  timelineContainer.innerHTML = timelineHTML;
}

// Function to create project card HTML
function createProjectCard(project) {
  const technologiesHTML = project.technologies
    .map((tech) => `<span class="tech-tag" role="listitem">${tech}</span>`)
    .join("");

  return `
    <article class="project-card" role="listitem">
      <div class="project-image-container">
        <img 
          src="${project.imageUrl}" 
          alt="Screenshot of ${
            project.title
          } project showing the main interface"
          class="project-image"
          loading="lazy"
          width="400"
          height="250"
          onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'250\\' viewBox=\\'0 0 400 250\\'%3E%3Crect width=\\'400\\' height=\\'250\\' fill=\\'%23333\\'/%3E%3Ctext x=\\'200\\' y=\\'125\\' text-anchor=\\'middle\\' dy=\\'0.3em\\' fill=\\'%23666\\' font-family=\\'Arial\\' font-size=\\'16\\'%3EProject Image%3C/text%3E%3C/svg%3E'"
        />
        <div class="project-overlay" aria-hidden="true">
          <div class="project-links">
            ${
              project.liveUrl
                ? `
              <a 
                href="${project.liveUrl}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="project-link project-link--demo"
                aria-label="View live demo of ${project.title} (opens in new tab)"
              >
                <i data-feather="external-link" aria-hidden="true"></i>
                <span>Live Demo</span>
              </a>
            `
                : ""
            }
            ${
              project.repoUrl
                ? `
              <a 
                href="${project.repoUrl}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="project-link project-link--repo"
                aria-label="View source code for ${project.title} on GitHub (opens in new tab)"
              >
                <i data-feather="github" aria-hidden="true"></i>
                <span>Source Code</span>
              </a>
            `
                : ""
            }
          </div>
        </div>
      </div>
      <div class="project-content">
        <h3 class="project-title">${project.title}</h3>
        <p class="project-description">${project.description}</p>
        <div class="project-technologies" role="list" aria-label="Technologies used in ${
          project.title
        }">
          ${technologiesHTML}
        </div>
      </div>
    </article>
  `;
}

// Function to render projects
async function renderProjects() {
  const projectsContainer = document.querySelector(".projects-container");

  if (!projectsContainer) {
    console.error("Projects container not found");
    return;
  }

  // Load projects data if not already loaded
  if (projects.length === 0) {
    await loadProjectsData();
  }

  // Clear existing content
  projectsContainer.innerHTML = "";

  // Generate project cards from project data
  const projectsHTML = projects
    .map((project) => createProjectCard(project))
    .join("");

  // Insert generated HTML
  projectsContainer.innerHTML = projectsHTML;

  // Re-initialize Feather icons for the new content
  if (typeof feather !== "undefined") {
    feather.replace();
  }
}

// Function to create skill category HTML
function createSkillCategory(categoryName, skillsList) {
  const skillsHTML = skillsList
    .map((skill) => `<span class="skill-tag" role="listitem">${skill}</span>`)
    .join("");

  return `
    <div class="skill-category" role="listitem">
      <h3 class="skill-category-title">${categoryName}</h3>
      <div class="skill-items" role="list" aria-label="${categoryName} skills">
        ${skillsHTML}
      </div>
    </div>
  `;
}

// Function to render skills section
async function renderSkills() {
  const skillsContainer = document.querySelector(".skills-container");

  if (!skillsContainer) {
    console.error("Skills container not found");
    return;
  }

  // Load skills data if not already loaded
  if (Object.keys(skills).length === 0) {
    await loadSkillsData();
  }

  // Clear existing content
  skillsContainer.innerHTML = "";

  // Generate skill categories from skills data
  const skillsHTML = Object.entries(skills)
    .map(([category, skillsList]) => createSkillCategory(category, skillsList))
    .join("");

  // Insert generated HTML
  skillsContainer.innerHTML = skillsHTML;
}

// Function to create education card HTML
function createEducationCard(edu) {
  const courseworkHTML = edu.relevantCoursework
    .map((course) => `<li class="coursework-item">${course}</li>`)
    .join("");

  const achievementsHTML = edu.achievements
    .map(
      (achievement) =>
        `<span class="achievement-badge" role="listitem">${achievement}</span>`
    )
    .join("");

  return `
    <article class="education-item" role="listitem">
      <div class="education-header">
        <h3 class="degree-title">${edu.degree}</h3>
        <h4 class="institution-name">${edu.institution}</h4>
        <div class="education-meta">
          <time class="graduation-date" datetime="${edu.graduationDate}">${
    edu.graduationDate
  }</time>
          ${
            edu.gpa
              ? `<span class="gpa" aria-label="Grade Point Average: ${edu.gpa}">GPA: ${edu.gpa}</span>`
              : ""
          }
        </div>
      </div>
      
      ${
        edu.relevantCoursework && edu.relevantCoursework.length > 0
          ? `
        <div class="coursework-section">
          <h5 class="coursework-title">Relevant Coursework</h5>
          <ul class="coursework-list" role="list">
            ${courseworkHTML}
          </ul>
        </div>
      `
          : ""
      }
      
      ${
        edu.achievements && edu.achievements.length > 0
          ? `
        <div class="achievements-section">
          <h5 class="achievements-title">Academic Achievements</h5>
          <div class="achievements-list" role="list" aria-label="Academic achievements">
            ${achievementsHTML}
          </div>
        </div>
      `
          : ""
      }
    </article>
  `;
}

// Function to render education section
async function renderEducation() {
  const educationContainer = document.querySelector(".education-container");

  if (!educationContainer) {
    console.error("Education container not found");
    return;
  }

  // Load education data if not already loaded
  if (education.length === 0) {
    await loadEducationData();
  }

  // Clear existing content
  educationContainer.innerHTML = "";

  // Generate education cards from education data
  const educationHTML = education
    .map((edu) => createEducationCard(edu))
    .join("");

  // Insert generated HTML
  educationContainer.innerHTML = educationHTML;
}

// Initialize all sections when DOM is loaded
document.addEventListener("DOMContentLoaded", async function () {
  try {
    // Preload all data for better performance
    await dataLoader.preload([
      DATA_URLS.projects,
      DATA_URLS.skills,
      DATA_URLS.education,
      DATA_URLS.experience,
    ]);

    // Load all data into global variables
    await loadAllData();

    // Use enhanced render functions with loading states
    renderTimelineWithLoading();
    renderProjectsWithLoading();

    // Render skills and education with slight delays for staggered loading
    setTimeout(async () => {
      try {
        await renderSkills();
        initScrollAnimations();
      } catch (error) {
        console.error("Failed to render skills:", error);
      }
    }, 200);

    setTimeout(async () => {
      try {
        await renderEducation();
        initScrollAnimations();
      } catch (error) {
        console.error("Failed to render education:", error);
      }
    }, 400);
  } catch (error) {
    console.error("Failed to initialize portfolio:", error);
    // Show error message to user
    showGlobalError("Failed to load portfolio data. Please refresh the page.");
  }
});

// Global error handler
function showGlobalError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "global-error";
  errorDiv.innerHTML = `
    <div class="error-content">
      <h3>Loading Error</h3>
      <p>${message}</p>
      <button onclick="location.reload()" class="retry-button">Retry</button>
    </div>
  `;
  document.body.appendChild(errorDiv);
}
// ===== NAVIGATION FUNCTIONALITY =====

// Navigation state
let isMenuOpen = false;

// Get navigation elements
const navContainer = document.querySelector(".nav-container");
const navMenu = document.querySelector(".nav-menu");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".nav-link");

// Get all sections for active highlighting
const sections = document.querySelectorAll("section, header");

// Smooth scrolling function
function smoothScrollTo(targetId) {
  const targetElement = document.getElementById(targetId);
  if (!targetElement) return;

  const headerOffset = 80; // Account for fixed navigation
  const elementPosition = targetElement.offsetTop;
  const offsetPosition = elementPosition - headerOffset;

  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth",
  });
}

// Handle navigation link clicks
function handleNavLinkClick(event) {
  event.preventDefault();

  const href = event.target.getAttribute("href");
  if (!href || !href.startsWith("#")) return;

  const targetId = href.substring(1);
  smoothScrollTo(targetId);

  // Close mobile menu if open
  if (isMenuOpen) {
    toggleMobileMenu();
  }
}

// Toggle mobile menu
function toggleMobileMenu() {
  isMenuOpen = !isMenuOpen;
  navMenu.classList.toggle("active", isMenuOpen);

  // Prevent body scroll when menu is open
  document.body.classList.toggle("nav-open", isMenuOpen);

  // Update toggle button icon
  const toggleIcon = navToggle.querySelector("i");
  if (toggleIcon) {
    toggleIcon.setAttribute("data-feather", isMenuOpen ? "x" : "menu");
    if (typeof feather !== "undefined") {
      feather.replace();
    }
  }

  // Update ARIA attributes for accessibility
  navToggle.setAttribute("aria-expanded", isMenuOpen.toString());
  navMenu.setAttribute("aria-hidden", (!isMenuOpen).toString());

  // Focus management for accessibility
  if (isMenuOpen) {
    // Focus first nav link when menu opens
    const firstNavLink = navMenu.querySelector(".nav-link");
    if (firstNavLink) {
      setTimeout(() => firstNavLink.focus(), 100);
    }
  } else {
    // Return focus to toggle button when menu closes
    navToggle.focus();
  }
}

// Close mobile menu when clicking outside
function handleOutsideClick(event) {
  if (isMenuOpen && !navContainer.contains(event.target)) {
    toggleMobileMenu();
  }
}

// Handle scroll events for active section highlighting and nav background
function handleScroll() {
  const scrollY = window.scrollY;

  // Add scrolled class to navigation for background effect
  if (scrollY > 50) {
    navContainer.classList.add("scrolled");
  } else {
    navContainer.classList.remove("scrolled");
  }

  // Find current active section
  let currentSection = "";

  sections.forEach((section) => {
    const sectionTop = section.offsetTop - 100; // Offset for navigation
    const sectionHeight = section.offsetHeight;

    if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
      currentSection = section.getAttribute("id");
    }
  });

  // Update active navigation link
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href && href.startsWith("#")) {
      const targetId = href.substring(1);

      if (targetId === currentSection) {
        link.classList.add("nav-link--active");
      } else {
        link.classList.remove("nav-link--active");
      }
    }
  });
}

// Throttle function for performance
function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Handle keyboard navigation
function handleKeyDown(event) {
  // Close mobile menu on Escape key
  if (event.key === "Escape" && isMenuOpen) {
    toggleMobileMenu();
  }

  // Handle Enter and Space for nav toggle
  if (
    (event.key === "Enter" || event.key === " ") &&
    event.target === navToggle
  ) {
    event.preventDefault();
    toggleMobileMenu();
  }

  // Handle arrow key navigation in mobile menu
  if (isMenuOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
    event.preventDefault();
    const navLinks = Array.from(document.querySelectorAll(".nav-link"));
    const currentIndex = navLinks.indexOf(document.activeElement);

    let nextIndex;
    if (event.key === "ArrowDown") {
      nextIndex = currentIndex < navLinks.length - 1 ? currentIndex + 1 : 0;
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : navLinks.length - 1;
    }

    navLinks[nextIndex].focus();
  }

  // Handle Tab key to trap focus in mobile menu
  if (event.key === "Tab" && isMenuOpen) {
    const focusableElements = navContainer.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
}

// Initialize navigation functionality
function initNavigation() {
  // Add event listeners for navigation links
  navLinks.forEach((link) => {
    link.addEventListener("click", handleNavLinkClick);
  });

  // Add event listener for mobile menu toggle
  if (navToggle) {
    navToggle.addEventListener("click", toggleMobileMenu);
  }

  // Add scroll event listener with throttling
  window.addEventListener("scroll", throttle(handleScroll, 16));

  // Add click outside listener for mobile menu
  document.addEventListener("click", handleOutsideClick);

  // Add keyboard event listeners
  document.addEventListener("keydown", handleKeyDown);

  // Set initial active section
  handleScroll();

  // Set initial ARIA attributes
  if (navToggle) {
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-controls", "nav-menu");
    navToggle.setAttribute("aria-label", "Toggle navigation menu");
  }

  if (navMenu) {
    navMenu.setAttribute("id", "nav-menu");
    navMenu.setAttribute("aria-hidden", "true");
  }
}

// Handle window resize to close mobile menu on desktop
function handleResize() {
  if (window.innerWidth > 768 && isMenuOpen) {
    toggleMobileMenu();
  }
}

// Handle touch events for better mobile interaction
let touchStartY = 0;
let touchEndY = 0;

function handleTouchStart(event) {
  touchStartY = event.changedTouches[0].screenY;
}

function handleTouchEnd(event) {
  touchEndY = event.changedTouches[0].screenY;
  handleSwipeGesture();
}

function handleSwipeGesture() {
  const swipeThreshold = 50;
  const swipeDistance = touchStartY - touchEndY;

  // Close mobile menu on upward swipe
  if (isMenuOpen && swipeDistance > swipeThreshold) {
    toggleMobileMenu();
  }
}

// Add event listeners
window.addEventListener("resize", throttle(handleResize, 250));

// Add touch event listeners for mobile menu
if (navMenu) {
  navMenu.addEventListener("touchstart", handleTouchStart, { passive: true });
  navMenu.addEventListener("touchend", handleTouchEnd, { passive: true });
}

// Initialize navigation when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initNavigation();

  // Add passive event listeners for better performance on mobile
  if ("passive" in document.addEventListener.prototype) {
    document.addEventListener("touchstart", function () {}, { passive: true });
    document.addEventListener("touchmove", function () {}, { passive: true });
  }

  // Optimize for mobile performance
  if (window.innerWidth <= 768) {
    // Reduce animation complexity on mobile
    document.documentElement.style.setProperty(
      "--transition-normal",
      "150ms ease-out"
    );
    document.documentElement.style.setProperty(
      "--transition-slow",
      "200ms ease-out"
    );
  }
});

// ===== ENHANCED SCROLL ANIMATIONS AND INTERACTIONS =====

// Create intersection observer for scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("animate-in");

      // Add stagger delay for multiple elements
      const siblings = Array.from(entry.target.parentNode.children);
      const index = siblings.indexOf(entry.target);
      entry.target.style.transitionDelay = `${index * 0.1}s`;
    }
  });
}, observerOptions);

// Enhanced scroll animations initialization
function initScrollAnimations() {
  // Add animation classes to elements
  const timelineItems = document.querySelectorAll(".timeline-item");
  timelineItems.forEach((item, index) => {
    const isLeft = index % 2 === 0;
    item.classList.add(isLeft ? "animate-fade-right" : "animate-fade-left");
    observer.observe(item);
  });

  const projectCards = document.querySelectorAll(".project-card");
  projectCards.forEach((card, index) => {
    card.classList.add("animate-scale-in");
    card.style.transitionDelay = `${index * 0.1}s`;
    observer.observe(card);
  });

  const skillCategories = document.querySelectorAll(".skill-category");
  skillCategories.forEach((category, index) => {
    category.classList.add("animate-on-scroll");
    category.style.transitionDelay = `${index * 0.15}s`;
    observer.observe(category);
  });

  const educationItems = document.querySelectorAll(".education-item");
  educationItems.forEach((item, index) => {
    item.classList.add("animate-fade-left");
    item.style.transitionDelay = `${index * 0.2}s`;
    observer.observe(item);
  });

  // Section reveal animations
  const sections = document.querySelectorAll("section");
  sections.forEach((section) => {
    section.classList.add("section-reveal");
    observer.observe(section);
  });
}

// ===== LOADING STATES AND MICRO-INTERACTIONS =====

// Show loading state for dynamic content
function showLoadingState(container, itemClass) {
  const loadingItems = Array.from({ length: 3 }, (_, i) => {
    const item = document.createElement("div");
    item.className = `${itemClass} loading`;
    item.style.height = "200px";
    return item;
  });

  container.innerHTML = "";
  loadingItems.forEach((item) => container.appendChild(item));
}

// Remove loading state
function hideLoadingState(container) {
  const loadingItems = container.querySelectorAll(".loading");
  loadingItems.forEach((item) => item.remove());
}

// Enhanced render functions with loading states
async function renderTimelineWithLoading() {
  const timelineContainer = document.querySelector(".timeline-container");
  if (!timelineContainer) return;

  // Show loading state
  showLoadingState(timelineContainer, "timeline-item");

  try {
    // Load and render timeline data
    await renderTimeline();
    initScrollAnimations();
  } catch (error) {
    console.error("Failed to render timeline:", error);
    timelineContainer.innerHTML =
      '<p class="error-message">Failed to load experience data</p>';
  }
}

async function renderProjectsWithLoading() {
  const projectsContainer = document.querySelector(".projects-container");
  if (!projectsContainer) return;

  // Show loading state
  showLoadingState(projectsContainer, "project-card");

  try {
    // Load and render projects data
    await renderProjects();
    initScrollAnimations();
  } catch (error) {
    console.error("Failed to render projects:", error);
    projectsContainer.innerHTML =
      '<p class="error-message">Failed to load projects data</p>';
  }
}

// ===== SCROLL PROGRESS INDICATOR =====
function initScrollProgress() {
  // Create scroll progress element
  const progressBar = document.createElement("div");
  progressBar.className = "scroll-progress";
  document.body.appendChild(progressBar);

  // Update progress on scroll
  function updateScrollProgress() {
    const scrollTop = window.pageYOffset;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    progressBar.style.width = `${scrollPercent}%`;
  }

  window.addEventListener("scroll", throttle(updateScrollProgress, 10));
}

// ===== MAGNETIC HOVER EFFECTS =====
function initMagneticHover() {
  const magneticElements = document.querySelectorAll(
    ".social-icon, .project-link, .btn"
  );

  magneticElements.forEach((element) => {
    element.addEventListener("mousemove", (e) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const moveX = x * 0.1;
      const moveY = y * 0.1;

      element.style.setProperty("--mouse-x", `${moveX}px`);
      element.style.setProperty("--mouse-y", `${moveY}px`);
    });

    element.addEventListener("mouseleave", () => {
      element.style.setProperty("--mouse-x", "0px");
      element.style.setProperty("--mouse-y", "0px");
    });
  });
}

// ===== TILT EFFECT FOR CARDS =====
function initTiltEffect() {
  const tiltElements = document.querySelectorAll(
    ".project-card, .skill-category, .education-item"
  );

  tiltElements.forEach((element) => {
    element.addEventListener("mousemove", (e) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;

      element.style.setProperty("--rotate-x", `${rotateX}deg`);
      element.style.setProperty("--rotate-y", `${rotateY}deg`);
    });

    element.addEventListener("mouseleave", () => {
      element.style.setProperty("--rotate-x", "0deg");
      element.style.setProperty("--rotate-y", "0deg");
    });
  });
}

// ===== TYPEWRITER EFFECT FOR MAIN TITLE (DISABLED) =====
function initTypewriterEffect() {
  // Typewriter effect disabled to prevent layout shifts
  // The main title will display normally without animation
  return;
}

// ===== PARALLAX SCROLLING EFFECT =====
function initParallaxEffect() {
  const parallaxElements = document.querySelectorAll(".header-container");

  function updateParallax() {
    const scrolled = window.pageYOffset;

    parallaxElements.forEach((element) => {
      const rate = scrolled * -0.5;
      element.style.transform = `translateY(${rate}px)`;
    });
  }

  window.addEventListener("scroll", throttle(updateParallax, 16));
}

// ===== SMOOTH REVEAL ANIMATIONS =====
function initSmoothReveal() {
  const revealElements = document.querySelectorAll(".section-reveal");

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -100px 0px",
    }
  );

  revealElements.forEach((element) => {
    revealObserver.observe(element);
  });
}

// ===== ENHANCED NAVIGATION INTERACTIONS =====
function enhanceNavigation() {
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    // Removed ripple effect to prevent circle hover interference

    // Enhanced hover effect
    link.addEventListener("mouseenter", () => {
      link.style.transform = "translateY(-2px)";
    });

    link.addEventListener("mouseleave", () => {
      link.style.transform = "translateY(0)";
    });
  });
}

// ===== PERFORMANCE OPTIMIZATIONS =====
function optimizeAnimations() {
  // Reduce animations on low-end devices
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    document.documentElement.style.setProperty("--animation-normal", "200ms");
    document.documentElement.style.setProperty("--animation-slow", "300ms");
  }

  // Disable animations on mobile for better performance
  if (window.innerWidth < 768) {
    document.documentElement.style.setProperty("--animation-normal", "150ms");
    document.documentElement.style.setProperty("--animation-slow", "200ms");
  }
}

// Initialize all animations and interactions
function initAllAnimations() {
  initScrollAnimations();
  initScrollProgress();
  initMagneticHover();
  initTiltEffect();
  initTypewriterEffect();
  initParallaxEffect();
  initSmoothReveal();
  enhanceNavigation();
  optimizeAnimations();
}

// Initialize all performance and accessibility features
function initPerformanceAndAccessibility() {
  initLazyLoading();
  optimizeImages();
  enhanceAccessibility();
  initPerformanceMonitoring();
}

// Initialize animations when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initAllAnimations();
  initPerformanceAndAccessibility();
});

// ===== LAZY LOADING FOR IMAGES =====
function initLazyLoading() {
  // Check if Intersection Observer is supported
  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;

            // Create a new image to preload
            const newImg = new Image();
            newImg.onload = () => {
              img.src = newImg.src;
              img.classList.add("loaded");
            };
            newImg.onerror = () => {
              img.classList.add("error");
            };

            // Start loading the image
            if (img.dataset.src) {
              newImg.src = img.dataset.src;
            }

            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: "50px 0px",
        threshold: 0.01,
      }
    );

    // Observe all lazy images
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      imageObserver.observe(img);
    });
  }
}

// ===== IMAGE OPTIMIZATION =====
function optimizeImages() {
  const images = document.querySelectorAll("img");

  images.forEach((img) => {
    // Add loading state
    img.addEventListener("load", () => {
      img.classList.add("loaded");
    });

    img.addEventListener("error", () => {
      img.classList.add("error");
      // Set fallback image
      if (!img.src.includes("data:image/svg+xml")) {
        img.src =
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'%3E%3Crect width='400' height='250' fill='%23333'/%3E%3Ctext x='200' y='125' text-anchor='middle' dy='0.3em' fill='%23666' font-family='Arial' font-size='16'%3EImage not available%3C/text%3E%3C/svg%3E";
      }
    });
  });
}

// ===== ACCESSIBILITY ENHANCEMENTS =====
function enhanceAccessibility() {
  // Add focus indicators for keyboard navigation
  const focusableElements = document.querySelectorAll(
    'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
  );

  focusableElements.forEach((element) => {
    element.addEventListener("focus", () => {
      element.classList.add("keyboard-focus");
    });

    element.addEventListener("blur", () => {
      element.classList.remove("keyboard-focus");
    });

    element.addEventListener("mousedown", () => {
      element.classList.remove("keyboard-focus");
    });
  });

  // Announce dynamic content changes to screen readers
  const announcer = document.createElement("div");
  announcer.setAttribute("aria-live", "polite");
  announcer.setAttribute("aria-atomic", "true");
  announcer.className = "sr-only";
  announcer.id = "announcer";
  document.body.appendChild(announcer);

  // Function to announce content changes
  window.announceToScreenReader = function (message) {
    announcer.textContent = message;
    setTimeout(() => {
      announcer.textContent = "";
    }, 1000);
  };
}

// ===== PERFORMANCE MONITORING =====
function initPerformanceMonitoring() {
  // Monitor Core Web Vitals
  if ("web-vital" in window) {
    // This would typically use the web-vitals library
    // For now, we'll use basic performance monitoring
  }

  // Monitor long tasks
  if ("PerformanceObserver" in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            console.warn("Long task detected:", entry.duration + "ms");
          }
        });
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch (e) {
      // PerformanceObserver not supported
    }
  }

  // Monitor memory usage (if available)
  if ("memory" in performance) {
    setInterval(() => {
      const memory = performance.memory;
      if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
        console.warn("High memory usage detected");
      }
    }, 30000); // Check every 30 seconds
  }
}

// ===== UTILITY FUNCTIONS =====

// Debounce function for performance
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Get element offset top accounting for fixed navigation
function getElementOffsetTop(element) {
  const headerOffset = 80;
  return element.offsetTop - headerOffset;
}

// Check if element is in viewport
function isElementInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Smooth scroll polyfill for older browsers
if (!("scrollBehavior" in document.documentElement.style)) {
  // Import smooth scroll polyfill if needed
  const script = document.createElement("script");
  script.src =
    "https://cdn.jsdelivr.net/gh/iamdustan/smoothscroll@master/src/smoothscroll.js";
  document.head.appendChild(script);
}
