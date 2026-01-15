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

app.get('/elevator', (req, res) => {
  res.json({
    currentFloor: elevator.currentFloor,
    requests: elevator.requests,
    riders: elevator.riders
  })
})

app.post('/elevator/request', (req, res) => {
  const { name, currentFloor, dropOffFloor } = req.body
  if (!name || dropOffFloor === undefined) {
    return res.status(400).json({ success: false, message: 'Invalid request' })
  }

  const person = new Person(name, currentFloor, dropOffFloor)
  elevator.requests.push(person)
  res.json({ success: true })
})

app.post('/elevator/move', (req, res) => {
  // Determine all floors to visit
  const allTargets = [
    ...elevator.requests.map(r => r.currentFloor),   // people waiting
    ...elevator.riders.map(r => r.dropOffFloor)     // people inside
  ];

  if (allTargets.length === 0) {
    return res.json({
      currentFloor: elevator.currentFloor,
      requests: elevator.requests,
      riders: elevator.riders
    });
  }

  // Determine closest floor to move towards
  let closest = allTargets.reduce((prev, curr) => {
    return Math.abs(curr - elevator.currentFloor) < Math.abs(prev - elevator.currentFloor) ? curr : prev;
  });

  // Move one floor toward the closest target
  if (elevator.currentFloor < closest) elevator.currentFloor++;
  else if (elevator.currentFloor > closest) elevator.currentFloor--;

  // Pick up anyone at the current floor
  const pickups = elevator.requests.filter(r => r.currentFloor === elevator.currentFloor);
  pickups.forEach(p => elevator.riders.push(p));
  elevator.requests = elevator.requests.filter(r => r.currentFloor !== elevator.currentFloor);

  // Drop off anyone at the current floor
  elevator.riders = elevator.riders.filter(r => r.dropOffFloor !== elevator.currentFloor);

  res.json({
    currentFloor: elevator.currentFloor,
    requests: elevator.requests,
    riders: elevator.riders
  });
});



app.post('/elevator/reset', (req, res) => {
  elevator.reset()
  elevator.requests = [];
  elevator.riders = [];
  res.json({ success: true })
})

// Force index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'))
})

const PORT = 3000
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
)
