import { requestFloor, moveElevator, resetElevator } from "./api.js";

const buildingEl = document.getElementById("building");
const floorButtonsEl = document.getElementById("floor-buttons");

const FLOOR_HEIGHT = 60;

// Elevator element
export const elevatorEl = document.createElement("div");
elevatorEl.id = "elevator";
elevatorEl.textContent = "🧍";
buildingEl.appendChild(elevatorEl);

// Keep track of active buttons
let activeRequests = [];
let pendingFloors = [];

const FLOOR_LABELS = ["G", "2", "3", "4", "5", "6", "7", "8", "9"];

// Render floors
export function renderFloors() {
  FLOOR_LABELS.forEach((label, index) => {
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
      btn.classList.add("active");
      activeRequests.push(btn);

      // Map 'G' to 0 for backend, others to number
      const floorNumber = label === "G" ? 0 : parseInt(label);

      // Track requested floors
      if (!pendingFloors.includes(floorNumber)) {
        pendingFloors.push(floorNumber);
      }

      // Send request to backend
      await requestFloor(floorNumber);

      console.log("Requested floors:", pendingFloors); // debug
    };

    floorButtonsEl.appendChild(btn);
  });
}

// Update elevator position visually
export function updateElevator(floorNumber) {
  elevatorEl.style.bottom = `${floorNumber * FLOOR_HEIGHT}px`;
}

// Simulation loop
let simulationInterval;
export function startSimulation() {
  if (simulationInterval) return; // avoid multiple intervals

  simulationInterval = setInterval(async () => {
    const state = await moveElevator();
    updateElevator(state.currentFloor);

    // Deactivate buttons for floors reached
    activeRequests.forEach((btn) => {
      if (parseInt(btn.innerText) === state.currentFloor) {
        btn.classList.remove("active");
      }
    });

    // Remove buttons that are done
    activeRequests = activeRequests.filter(
      (btn) => parseInt(btn.innerText) !== state.currentFloor
    );
  }, 1000); // 1 second per move
}

// Reset UI
export async function resetUI() {
  clearInterval(simulationInterval);
  simulationInterval = null;

  await resetElevator();
  updateElevator(0);
  document
    .querySelectorAll(".floor-btn")
    .forEach((b) => b.classList.remove("active"));
  activeRequests = [];
}
