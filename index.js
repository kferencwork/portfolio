const sections = document.querySelectorAll("section");
const navLinks = document.querySelectorAll("nav a");

// 🔥 MINDEN anchor (nem csak nav!)
const allLinks = document.querySelectorAll('a[href^="#"]');

let currentIndex = 0;
let isAnimating = false;
let animationFrame = null;
let snapLock = false;

let SMOOTHNESS = 0.08;
let targetScrollY = window.scrollY;

let touchStartY = 0;
let isTouching = false;

// ===== HELPERS =====
function getMaxScroll() {
  return document.documentElement.scrollHeight - window.innerHeight;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// ===== ACTIVE NAV =====
function updateActiveNav(index) {
  navLinks.forEach((link, i) => {
    link.classList.remove("active-0", "active-1", "active-2");

    if (i === index) {
      link.classList.add(`active-${index}`);
    }
  });
}

// ===== SNAP SCROLL =====
function smoothScrollTo(targetY, duration = 900) {
  if (animationFrame) cancelAnimationFrame(animationFrame);

  const startY = window.scrollY;
  const diff = targetY - startY;
  let startTime = null;

  isAnimating = true;

  function animate(time) {
    if (!startTime) startTime = time;

    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);

    const newY = startY + diff * eased;

    window.scrollTo(0, newY);
    targetScrollY = newY;

    if (progress < 1) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      isAnimating = false;
      animationFrame = null;
      targetScrollY = targetY; // 🔥 fix visszarántás ellen
    }
  }

  animationFrame = requestAnimationFrame(animate);
}

// ===== SECTION SCROLL =====
function scrollToSection(index, direction = "down") {
  if (index < 0 || index >= sections.length) return;

  currentIndex = index;
  updateActiveNav(currentIndex);

  const section = sections[index];

  let targetY;

  if (direction === "up") {
    targetY = section.offsetTop + section.offsetHeight - window.innerHeight;
  } else {
    targetY = section.offsetTop;
  }

  smoothScrollTo(targetY);

  snapLock = true;
  setTimeout(() => (snapLock = false), 700);
}

// ===== FREE SCROLL =====
function startFreeScroll() {
  if (animationFrame) return;

  function animate() {
    const currentY = window.scrollY;

    targetScrollY = Math.max(0, Math.min(targetScrollY, getMaxScroll()));

    const diff = targetScrollY - currentY;

    let velocity = diff * SMOOTHNESS;

    if (Math.abs(velocity) < 0.1) {
      velocity = diff * 0.02;
    }

    if (Math.abs(diff) > 0.3) {
      window.scrollTo(0, currentY + velocity);
      animationFrame = requestAnimationFrame(animate);
    } else {
      animationFrame = null;
    }
  }

  animationFrame = requestAnimationFrame(animate);
}

// ===== 🔥 ALL LINKS (NAV + GOMBOK) =====
allLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    const targetId = link.getAttribute("href");

    if (!targetId.startsWith("#")) return;

    const targetSection = document.querySelector(targetId);
    if (!targetSection) return;

    e.preventDefault();

    const index = [...sections].indexOf(targetSection);

    if (index !== -1) {
      scrollToSection(index, "down");
    }
  });
});

// ===== WHEEL =====
window.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    if (isAnimating) return;
    handleScroll(e.deltaY);
  },
  { passive: false },
);

// ===== TOUCH =====
window.addEventListener("touchstart", (e) => {
  touchStartY = e.touches[0].clientY;
  isTouching = true;
});

window.addEventListener(
  "touchmove",
  (e) => {
    if (!isTouching) return;

    const y = e.touches[0].clientY;
    const deltaY = touchStartY - y;

    e.preventDefault();
    handleScroll(deltaY);

    touchStartY = y;
  },
  { passive: false },
);

window.addEventListener("touchend", () => {
  isTouching = false;
});

// ===== 🔥 JAVÍTOTT SCROLL LOGIKA =====
function handleScroll(deltaY) {
  const section = sections[currentIndex];

  const sectionTop = section.offsetTop;
  const sectionBottom = sectionTop + section.offsetHeight;

  const currentY = window.scrollY;
  const viewportBottom = currentY + window.innerHeight;

  const isScrollingDown = deltaY > 0;
  const isScrollingUp = deltaY < 0;

  // ===== LEFELÉ =====
  if (isScrollingDown) {
    // még nem értük el az alját → free scroll
    if (viewportBottom < sectionBottom - 2) {
      targetScrollY += deltaY;
      targetScrollY = Math.min(targetScrollY, getMaxScroll());
      startFreeScroll();
      return;
    }

    // alján vagy → snap
    if (!snapLock) {
      scrollToSection(currentIndex + 1, "down");
    }
  }

  // ===== FELFELÉ =====
  if (isScrollingUp) {
    // még nem értük el a tetejét → free scroll
    if (currentY > sectionTop + 2) {
      targetScrollY += deltaY;
      targetScrollY = Math.max(targetScrollY, 0);
      startFreeScroll();
      return;
    }

    // tetején vagy → snap
    if (!snapLock) {
      scrollToSection(currentIndex - 1, "up");
    }
  }
}

// ===== INDEX =====
window.addEventListener("scroll", () => {
  if (isAnimating || snapLock) return;

  sections.forEach((section, i) => {
    const rect = section.getBoundingClientRect();

    if (
      rect.top <= window.innerHeight / 2 &&
      rect.bottom >= window.innerHeight / 2
    ) {
      if (currentIndex !== i) {
        currentIndex = i;
        updateActiveNav(currentIndex);
      }
    }
  });
});

// INIT
updateActiveNav(0);
