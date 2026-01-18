import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import Elevator from './elevator.js'
import Person from './person.js'

const app = express()
app.use(cors())
app.use(express.json())

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Serve frontend
app.use(express.static(path.join(__dirname, '../public')))

// Elevator instance
const elevator = new Elevator()

// Get elevator status
app.get('/elevator', (req, res) => {
  res.json({
    currentFloor: elevator.currentFloor,
    requests: elevator.requests,
    riders: elevator.riders
  })
})

// Add a new elevator request
app.post('/elevator/request', (req, res) => {
  // Use body if it exists, otherwise use query parameters
  const data = req.body && Object.keys(req.body).length ? req.body : req.query;

  const name = data.name;
  const currentFloor = Number(data.currentFloor) || 0;
  const dropOffFloor = Number(data.dropOffFloor);

  if (!name || dropOffFloor === undefined) {
    return res.status(400).json({ success: false, message: 'Invalid request' });
  }

  const person = new Person(name, currentFloor, dropOffFloor);
  elevator.requests.push(person);

  res.json({ success: true });
});

// Move the elevator one step
app.post('/elevator/move', (req, res) => {
  // Step 1: move pending requests to active riders
  if (elevator.requests.length > 0) {
    elevator.riders.push(...elevator.requests)
    elevator.requests = []
  }

  // Step 2: if no riders, return current floor
  if (elevator.riders.length === 0) {
    return res.json({ currentFloor: elevator.currentFloor })
  }

  // Step 3: find closest target floor
  const targets = elevator.riders.map(r => r.dropOffFloor)
  const closest = targets.reduce((prev, curr) =>
    Math.abs(curr - elevator.currentFloor) < Math.abs(prev - elevator.currentFloor)
      ? curr
      : prev
  )

  // Step 4: move elevator toward closest floor
  if (elevator.currentFloor < closest) elevator.currentFloor++
  else if (elevator.currentFloor > closest) elevator.currentFloor--

  // Step 5: drop off riders at current floor
  const droppedRiders = elevator.riders.filter(r => r.dropOffFloor === elevator.currentFloor)
  elevator.riders = elevator.riders.filter(r => r.dropOffFloor !== elevator.currentFloor)

  res.json({
    currentFloor: elevator.currentFloor,
    droppedRiders,
    riders: elevator.riders
  })
})

// Reset elevator
app.post('/elevator/reset', (req, res) => {
  elevator.reset()
  elevator.requests = []
  elevator.riders = []
  res.json({ success: true })
})

// Force index.html for frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'))
})

const PORT = 3000
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
)
