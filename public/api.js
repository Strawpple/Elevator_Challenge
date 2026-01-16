const BASE_URL = 'http://localhost:3000/elevator';

// Request elevator to a floor
export async function requestFloor(floor) {
  try {
    
    const response = await fetch(`${BASE_URL}/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Guest',
        currentFloor: 0, 
        dropOffFloor: floor
      })
    });
    return await response.json();
  } catch (err) {
    console.error('Error requesting floor:', err);
  }
}

// Move elevator one step
export async function moveElevator() {
  try {
    const response = await fetch(`${BASE_URL}/move`, {
      method: 'POST'
    });
    return await response.json();
  } catch (err) {
    console.error('Error moving elevator:', err);
  }
}

// Reset elevator
export async function resetElevator() {
  try {
    const response = await fetch(`${BASE_URL}/reset`, {
      method: 'POST'
    });
    return await response.json();
  } catch (err) {
    console.error('Error resetting elevator:', err);
  }
}

// Get current elevator state
export async function getState() {
  try {
    const response = await fetch(BASE_URL);
    return await response.json();
  } catch (err) {
    console.error('Error getting state:', err);
  }
}
