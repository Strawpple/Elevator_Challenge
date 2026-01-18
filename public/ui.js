import { requestFloor, moveElevator, resetElevator } from "./api.js";

const buildingEl = document.getElementById("building");
const floorButtonsEl = document.getElementById("floor-buttons");

const FLOOR_HEIGHT = 50;

export const riders = [];

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
const pendingRiderFloors = new Set(); // Tracks all rider destinations

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

// Elevator position
export function updateElevator(floorNumber) {
  elevatorEl.style.bottom = `${floorNumber * FLOOR_HEIGHT}px`;
  currentFloor = floorNumber;
}

// Simulation
let simulationInterval;
let totalFloorsTraversed = 0;
let totalStops = 0;
let lastFloor = 0;
let currentFloor = 0;

export async function startSimulation(ridersQueue = []) {
  // Sort riders by dropOffFloor ascending
  ridersQueue.sort((a, b) => a.to - b.to);

  // Queue floors
  for (const rider of ridersQueue) {
    const data = {
      name: rider.name,
      dropOffFloor: rider.to,
      currentFloor: currentFloor,
    };

    const response = await requestFloor(data);

    if (response.success) {
      pendingRiderFloors.add(data.dropOffFloor);
    }
  }

  // Always open doors at start
  elevatorEl.classList.add("open");
  setTimeout(() => {
    elevatorEl.classList.remove("open");
  }, 600);

  if (simulationInterval) return;

  simulationInterval = setInterval(() => {
    if (pendingRiderFloors.size === 0) {
      clearInterval(simulationInterval);
      simulationInterval = null;
      return;
    }

    // Determine next target floor (lowest pending floor)
    const nextFloor = Math.min(...pendingRiderFloors);

    // Move elevator one floor at a time
    if (currentFloor < nextFloor) currentFloor++;
    else if (currentFloor > nextFloor) currentFloor--;
    
    totalFloorsTraversed++;
    updateElevator(currentFloor);

    // Determine direction
    const dir = currentFloor > lastFloor ? "up" : "down";
    updateIndicator(currentFloor, dir);

    // Stop at floor if rider exists
    if (pendingRiderFloors.has(currentFloor)) {
      elevatorEl.classList.add("open"); // Open doors

      // Optional: log names of riders exiting at this floor
      const exitingRiders = ridersQueue
        .filter(r => r.to === currentFloor)
        .map(r => r.name);

      console.log(`Floor ${currentFloor}: ${exitingRiders.join(", ")} exited`);

      setTimeout(() => {
        elevatorEl.classList.remove("open"); // Close doors after 600ms
      }, 600);

      totalStops++;
      pendingRiderFloors.delete(currentFloor);
    }

    lastFloor = currentFloor;

    // Update stats in DOM
    document.getElementById("floors-count").innerText = totalFloorsTraversed;
    document.getElementById("stops-count").innerText = totalStops;

  }, 1600); // Update every 600ms per floor
}


// Update floor indicator
export function updateIndicator(floorNumber, direction = "up") {
  const indicator = document.getElementById("indicator");
  const arrow = document.getElementById("direction");
  if (indicator) indicator.innerText = FLOOR_LABELS[floorNumber];
  if (arrow) arrow.innerText = direction === "up" ? "⬆️" : "⬇️";
}

// Reset UI
export async function resetUI() {
  clearInterval(simulationInterval);
  simulationInterval = null;

  await resetElevator();
  updateElevator(0);
  lastFloor = 0;
  pendingRiderFloors.clear();

  totalFloorsTraversed = 0;
  totalStops = 0;
  document.getElementById("floors-count").innerText = totalFloorsTraversed;
  document.getElementById("stops-count").innerText = totalStops;

  document
    .querySelectorAll(".floor-btn")
    .forEach((b) => b.classList.remove("active"));
  activeRequests = [];
}
