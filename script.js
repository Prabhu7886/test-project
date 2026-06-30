const nameSets = {
  classic: ["Amelia","Arthur","Clara","Elias","Eleanor","Felix","Florence","Henry","Iris","Julian","Louisa","Miles","Nora","Oscar","Theodore","Violet","Walter","Ada","Cecilia","Hugo","Margot","Simon"],
  modern: ["Arlo","Avery","Bodhi","Cleo","Elio","Emery","Indie","Juno","Kai","Lennox","Mila","Nico","Nova","Remi","Romy","Sage","Soren","Thea","Zara","Zion","Marlow","Koa"],
  nature: ["Aspen","Briar","Cove","Dahlia","Flora","Forrest","Hazel","Ivy","Jasper","Laurel","Linden","Meadow","Olive","Orion","Rain","Reed","River","Rowan","Sky","Willow","Wren","Juniper"],
};

const accents = ["#a855f7","#9ce5ce","#ff9c82","#d5b8f5","#7087ff"];
const grid = document.querySelector("#name-grid");
const styleSelect = document.querySelector("#name-style");
const countSelect = document.querySelector("#name-count");
const shuffleButton = document.querySelector("#shuffle");
const toast = document.querySelector("#toast");
let toastTimer;

function shuffled(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function renderNames() {
  const pool = styleSelect.value === "mixed" ? Object.values(nameSets).flat() : nameSets[styleSelect.value];
  const names = shuffled(pool).slice(0, Number(countSelect.value));
  grid.replaceChildren();
  names.forEach((name, index) => {
    const card = document.createElement("button");
    card.className = "name-card";
    card.type = "button";
    card.style.setProperty("--accent", accents[index % accents.length]);
    card.style.animationDelay = `${index * 42}ms`;
    card.setAttribute("aria-label", `Copy ${name}`);
    card.innerHTML = `<strong>${name}</strong><span aria-hidden="true">⧉</span>`;
    card.addEventListener("click", () => copyName(name));
    grid.append(card);
  });
  shuffleButton.classList.remove("spin");
  void shuffleButton.offsetWidth;
  shuffleButton.classList.add("spin");
}

async function copyName(name) {
  try { await navigator.clipboard.writeText(name); } catch { /* clipboard may be unavailable on file URLs */ }
  clearTimeout(toastTimer);
  toast.textContent = `${name} copied`;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1500);
}

shuffleButton.addEventListener("click", renderNames);
styleSelect.addEventListener("change", renderNames);
countSelect.addEventListener("change", renderNames);
document.querySelector("#year").textContent = new Date().getFullYear();
renderNames();

// Canvas adaptation of the supplied React Bits DotField component.
const canvas = document.querySelector("#dot-field");
const context = canvas.getContext("2d", { alpha: true });
const mouse = { x: -9999, y: -9999, lastX: -9999, lastY: -9999, speed: 0 };
const config = { radius: 1.5, spacing: 14, cursorRadius: 500, strength: 67 };
let dots = [];
let width = 0;
let height = 0;
let engagement = 0;
let resizeTimer;

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  const step = config.radius + config.spacing;
  const columns = Math.floor(width / step);
  const rows = Math.floor(height / step);
  const padX = (width % step) / 2;
  const padY = (height % step) / 2;
  dots = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = padX + column * step + step / 2;
      const y = padY + row * step + step / 2;
      dots.push({ anchorX: x, anchorY: y, x, y });
    }
  }
}

function updateSpeed() {
  const distance = Math.hypot(mouse.lastX - mouse.x, mouse.lastY - mouse.y);
  mouse.speed += (distance - mouse.speed) * 0.5;
  if (mouse.speed < 0.001) mouse.speed = 0;
  mouse.lastX = mouse.x;
  mouse.lastY = mouse.y;
}

function draw() {
  engagement += (Math.min(mouse.speed / 5, 1) - engagement) * 0.06;
  if (engagement < 0.001) engagement = 0;
  context.clearRect(0, 0, width, height);
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "rgba(168,85,247,.35)");
  gradient.addColorStop(1, "rgba(180,151,207,.25)");
  context.fillStyle = gradient;
  context.beginPath();
  for (const dot of dots) {
    const dx = mouse.x - dot.anchorX;
    const dy = mouse.y - dot.anchorY;
    const distance = Math.hypot(dx, dy);
    if (distance < config.cursorRadius && engagement > 0.01) {
      const push = (1 - distance / config.cursorRadius) ** 2 * config.strength * engagement;
      const angle = Math.atan2(dy, dx);
      dot.x += (dot.anchorX - Math.cos(angle) * push - dot.x) * 0.15;
      dot.y += (dot.anchorY - Math.sin(angle) * push - dot.y) * 0.15;
    } else {
      dot.x += (dot.anchorX - dot.x) * 0.1;
      dot.y += (dot.anchorY - dot.y) * 0.1;
    }
    const radius = config.radius / 2;
    context.moveTo(dot.x + radius, dot.y);
    context.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
  }
  context.fill();
  requestAnimationFrame(draw);
}

window.addEventListener("mousemove", (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
}, { passive: true });
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(resizeCanvas, 100);
});
resizeCanvas();
setInterval(updateSpeed, 20);
requestAnimationFrame(draw);
