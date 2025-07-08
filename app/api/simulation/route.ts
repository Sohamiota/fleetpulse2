import { NextResponse } from "next/server"

let simulationInterval: NodeJS.Timeout | null = null
let isRunning = false

// Mock fleet data for simulation
const fleetDevices = [
  { id: "van-001", name: "Delivery Van 001", baseLocation: { lat: 37.7749, lng: -122.4194 } },
  { id: "van-002", name: "Delivery Van 002", baseLocation: { lat: 37.7849, lng: -122.4094 } },
  { id: "truck-001", name: "Cargo Truck 001", baseLocation: { lat: 37.7649, lng: -122.4294 } },
  { id: "van-003", name: "Delivery Van 003", baseLocation: { lat: 37.7549, lng: -122.4394 } },
  { id: "truck-002", name: "Cargo Truck 002", baseLocation: { lat: 37.7949, lng: -122.3994 } },
]

function generateTelemetryData(device: (typeof fleetDevices)[0]) {
  // Simulate movement around base location
  const latOffset = (Math.random() - 0.5) * 0.01 // ~0.5 mile radius
  const lngOffset = (Math.random() - 0.5) * 0.01

  return {
    deviceId: device.id,
    timestamp: Date.now(),
    location: {
      lat: device.baseLocation.lat + latOffset,
      lng: device.baseLocation.lng + lngOffset,
    },
    metrics: {
      temperature: Math.floor(Math.random() * 30) + 70, // 70-100°F
      speed: Math.floor(Math.random() * 60) + 20, // 20-80 mph
      fuel: Math.floor(Math.random() * 80) + 20, // 20-100%
      humidity: Math.floor(Math.random() * 40) + 30, // 30-70%
    },
  }
}

export async function POST(request: Request) {
  const { action } = await request.json()

  if (action === "start" && !isRunning) {
    isRunning = true

    // Start simulation
    simulationInterval = setInterval(() => {
      fleetDevices.forEach((device) => {
        const telemetryData = generateTelemetryData(device)

        // In a real implementation, you would:
        // 1. Save to database
        // 2. Emit via WebSocket to connected clients
        console.log("Simulated telemetry:", telemetryData)
      })
    }, 2000) // Every 2 seconds

    return NextResponse.json({ success: true, message: "Simulation started" })
  }

  if (action === "stop" && isRunning) {
    isRunning = false

    if (simulationInterval) {
      clearInterval(simulationInterval)
      simulationInterval = null
    }

    return NextResponse.json({ success: true, message: "Simulation stopped" })
  }

  return NextResponse.json({
    success: false,
    message: `Cannot ${action} simulation. Current state: ${isRunning ? "running" : "stopped"}`,
  })
}

export async function GET() {
  return NextResponse.json({
    isRunning,
    devices: fleetDevices.length,
  })
}
