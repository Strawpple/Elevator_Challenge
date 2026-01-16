import { requestFloor, moveElevator, resetElevator } from "./api.js";

const buildingEl = document.getElementById("building");
const floorButtonsEl = document.getElementById("floor-buttons");

const FLOOR_HEIGHT = 50;

// Elevator element
export const elevatorEl = document.createElement("div");
elevatorEl.id = "elevator";
elevatorEl.textContent = "🧍";
elevatorEl.style.position = "absolute";
elevatorEl.style.left = "50%";
elevatorEl.style.transform = "translateX(-50%)";
elevatorEl.style.bottom = "0px";
elevatorEl.style.transition = "bottom 0.4s linear";

buildingEl.appendChild(elevatorEl);

// Keep track of active buttons
let activeRequests = [];

const FLOOR_LABELS = ["G", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

// Render floors
export function renderFloors() {
  FLOOR_LABELS.forEach((label) => {
    const floor = document.createElement("div");
    floor.className = "floor";
    floor.style.height = `${FLOOR_HEIGHT}px`;
    floor.textContent = `Floor ${label}`;
    buildingEl.appendChild(floor);
  });
}

// Render buttons
export function renderButtons() {
  FLOOR_LABELS.forEach((label) => {
    const btn = document.createElement("button");
    btn.className = "floor-btn";
    btn.innerText = label;

    btn.onclick = async () => {
      const floorNumber = FLOOR_LABELS.indexOf(label);

      // prevent duplicate requests
      if (
        activeRequests.some(
          (b) => FLOOR_LABELS.indexOf(b.innerText) === floorNumber
        )
      )
        return;

      btn.classList.add("active");
      activeRequests.push(btn);

      await requestFloor(floorNumber);
      startSimulation();
    };

    floorButtonsEl.appendChild(btn);
  });
}

// elevator position
export function updateElevator(floorNumber) {
  elevatorEl.style.bottom = `${floorNumber * FLOOR_HEIGHT}px`;
  currentFloor = floorNumber;
}

// Simulation
let simulationInterval;
let lastFloor = 0;
let currentFloor = 0;
export function startSimulation() {
  if (simulationInterval) return;
  lastFloor = currentFloor;
  simulationInterval = setInterval(async () => {
    const state = await moveElevator();

    let dir = "up";
    if (state.currentFloor > lastFloor) dir = "up";
    else if (state.currentFloor < lastFloor) dir = "down";

    updateElevator(state.currentFloor);
    updateIndicator(state.currentFloor, dir);

    activeRequests.forEach((btn) => {
      const btnFloor = FLOOR_LABELS.indexOf(btn.innerText);
      if (btnFloor === state.currentFloor) {
        btn.classList.remove("active");

        // open doors
        elevatorEl.classList.add("open");

        setTimeout(() => {
          elevatorEl.classList.remove("open");
        }, 600);
      }
    });

    activeRequests = activeRequests.filter((btn) => {
      const btnFloor = FLOOR_LABELS.indexOf(btn.innerText);
      return btnFloor !== state.currentFloor;
    });

    // stop when idle
    if (activeRequests.length === 0) {
      clearInterval(simulationInterval);
      simulationInterval = null;
    }
  }, 1000);
}

// Update floor indicator
export function updateIndicator(floorNumber, direction = "up") {
  const indicator = document.getElementById("indicator");
  const arrow = document.getElementById("direction");
  if (indicator) indicator.innerText = FLOOR_LABELS[floorNumber];
  if (arrow) arrow.innerText = direction === "up" ? "⬆️" : "⬇️";
}

export async function resetUI() {
  clearInterval(simulationInterval);
  simulationInterval = null;

  await resetElevator();
  updateElevator(0);
  lastFloor = 0;

  document
    .querySelectorAll(".floor-btn")
    .forEach((b) => b.classList.remove("active"));

  activeRequests = [];
}
