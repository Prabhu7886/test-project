const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".site-nav");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const sections = [...document.querySelectorAll("main section[id]")];

function closeMenu() {
  menuButton.setAttribute("aria-expanded", "false");
  navigation.classList.remove("open");
  document.body.classList.remove("menu-open");
}

menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  navigation.classList.toggle("open", !isOpen);
  document.body.classList.toggle("menu-open", !isOpen);
});

navLinks.forEach((link) => link.addEventListener("click", closeMenu));

const revealObserver = new IntersectionObserver(
  (entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  }),
  { threshold: 0.12 },
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const navObserver = new IntersectionObserver(
  (entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id));
  }),
  { rootMargin: "-35% 0px -55% 0px" },
);

sections.forEach((section) => navObserver.observe(section));
document.getElementById("year").textContent = new Date().getFullYear();

// Canvas adaptation of React Bits' DotField, used as the site's fixed background.
const dotCanvas = document.querySelector("#dot-field");
const dotContext = dotCanvas.getContext("2d", { alpha: true });
const dotMouse = { x: -9999, y: -9999, lastX: -9999, lastY: -9999, speed: 0 };
const dotConfig = {
  radius: 1.5,
  spacing: 14,
  cursorRadius: 500,
  bulgeStrength: 67,
};
const reduceDotMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let fieldDots = [];
let fieldWidth = 0;
let fieldHeight = 0;
let fieldEngagement = 0;
let fieldResizeTimer;
let fieldFrame;

function resizeDotField() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  fieldWidth = window.innerWidth;
  fieldHeight = window.innerHeight;
  dotCanvas.width = fieldWidth * dpr;
  dotCanvas.height = fieldHeight * dpr;
  dotContext.setTransform(dpr, 0, 0, dpr, 0, 0);

  const step = dotConfig.radius + dotConfig.spacing;
  const columns = Math.floor(fieldWidth / step);
  const rows = Math.floor(fieldHeight / step);
  const padX = (fieldWidth % step) / 2;
  const padY = (fieldHeight % step) / 2;
  fieldDots = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = padX + column * step + step / 2;
      const y = padY + row * step + step / 2;
      fieldDots.push({ anchorX: x, anchorY: y, x, y });
    }
  }

  if (reduceDotMotion) drawDotField();
}

function updateDotSpeed() {
  const distance = Math.hypot(dotMouse.lastX - dotMouse.x, dotMouse.lastY - dotMouse.y);
  dotMouse.speed += (distance - dotMouse.speed) * 0.5;
  if (dotMouse.speed < 0.001) dotMouse.speed = 0;
  dotMouse.lastX = dotMouse.x;
  dotMouse.lastY = dotMouse.y;
}

function drawDotField() {
  fieldEngagement += (Math.min(dotMouse.speed / 5, 1) - fieldEngagement) * 0.06;
  if (fieldEngagement < 0.001) fieldEngagement = 0;
  dotContext.clearRect(0, 0, fieldWidth, fieldHeight);

  if (fieldEngagement > 0.01) {
    const glow = dotContext.createRadialGradient(
      dotMouse.x,
      dotMouse.y,
      0,
      dotMouse.x,
      dotMouse.y,
      160,
    );
    glow.addColorStop(0, `rgba(183, 221, 213, ${0.2 * fieldEngagement})`);
    glow.addColorStop(1, "rgba(183, 221, 213, 0)");
    dotContext.fillStyle = glow;
    dotContext.fillRect(0, 0, fieldWidth, fieldHeight);
  }

  const gradient = dotContext.createLinearGradient(0, 0, fieldWidth, fieldHeight);
  gradient.addColorStop(0, "rgba(241, 111, 81, 0.5)");
  gradient.addColorStop(1, "rgba(40, 123, 141, 0.34)");
  dotContext.fillStyle = gradient;
  dotContext.beginPath();

  for (const dot of fieldDots) {
    const dx = dotMouse.x - dot.anchorX;
    const dy = dotMouse.y - dot.anchorY;
    const distance = Math.hypot(dx, dy);

    if (!reduceDotMotion && distance < dotConfig.cursorRadius && fieldEngagement > 0.01) {
      const push =
        (1 - distance / dotConfig.cursorRadius) ** 2 *
        dotConfig.bulgeStrength *
        fieldEngagement;
      const angle = Math.atan2(dy, dx);
      dot.x += (dot.anchorX - Math.cos(angle) * push - dot.x) * 0.15;
      dot.y += (dot.anchorY - Math.sin(angle) * push - dot.y) * 0.15;
    } else {
      dot.x += (dot.anchorX - dot.x) * 0.1;
      dot.y += (dot.anchorY - dot.y) * 0.1;
    }

    const radius = dotConfig.radius / 2;
    dotContext.moveTo(dot.x + radius, dot.y);
    dotContext.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
  }

  dotContext.fill();
  if (!reduceDotMotion) fieldFrame = requestAnimationFrame(drawDotField);
}

if (!reduceDotMotion) {
  window.addEventListener(
    "mousemove",
    (event) => {
      dotMouse.x = event.clientX;
      dotMouse.y = event.clientY;
    },
    { passive: true },
  );
  setInterval(updateDotSpeed, 20);
}

window.addEventListener("resize", () => {
  clearTimeout(fieldResizeTimer);
  fieldResizeTimer = setTimeout(resizeDotField, 100);
});

resizeDotField();
if (!reduceDotMotion) fieldFrame = requestAnimationFrame(drawDotField);
