import { upsertDevice } from "./db-devices"
import { insertTelemetry } from "./db-telemetry"
import { emitTelemetryUpdate } from "./socket-server"

export interface SimulationDevice {
  id: string
  name: string
  type: string
  baseLocation: { lat: number; lng: number }
  route: "highway" | "downtown" | "residential" | "industrial" | "suburban"
  currentLocation: { lat: number; lng: number }
  currentMetrics: {
    temperature: number
    speed: number
    fuel: number
    humidity: number
  }
  direction: { lat: number; lng: number }
  speedMultiplier: number
}

export class SimulationEngine {
  private devices: Map<string, SimulationDevice> = new Map()
  private interval: NodeJS.Timeout | null = null
  private isRunning = false
  private updateInterval = 2000 // 2 seconds

  constructor() {
    this.initializeDevices()
  }

  private initializeDevices() {
    const fleetDevices = [
      {
        id: "van-001",
        name: "Delivery Van 001",
        type: "delivery",
        baseLocation: { lat: 37.7749, lng: -122.4194 },
        route: "downtown" as const,
      },
      {
        id: "van-002",
        name: "Delivery Van 002",
        type: "delivery",
        baseLocation: { lat: 37.7849, lng: -122.4094 },
        route: "suburban" as const,
      },
      {
        id: "truck-001",
        name: "Cargo Truck 001",
        type: "cargo",
        baseLocation: { lat: 37.7649, lng: -122.4294 },
        route: "highway" as const,
      },
      {
        id: "van-003",
        name: "Delivery Van 003",
        type: "delivery",
        baseLocation: { lat: 37.7549, lng: -122.4394 },
        route: "residential" as const,
      },
      {
        id: "truck-002",
        name: "Cargo Truck 002",
        type: "cargo",
        baseLocation: { lat: 37.7949, lng: -122.3994 },
        route: "industrial" as const,
      },
    ]

    fleetDevices.forEach((device) => {
      const movementRange = this.getMovementRange(device.route)
      const speedMultiplier = this.getSpeedMultiplier(device.route)

      this.devices.set(device.id, {
        ...device,
        currentLocation: { ...device.baseLocation },
        currentMetrics: {
          temperature: 75,
          speed: 0,
          fuel: 100,
          humidity: 50,
        },
        direction: {
          lat: (Math.random() - 0.5) * movementRange.lat,
          lng: (Math.random() - 0.5) * movementRange.lng,
        },
        speedMultiplier,
      })
    })
  }

  private getMovementRange(route: SimulationDevice["route"]) {
    switch (route) {
      case "highway":
        return { lat: 0.002, lng: 0.005 } // Faster movement
      case "downtown":
        return { lat: 0.001, lng: 0.001 } // Slower, more constrained
      case "residential":
        return { lat: 0.0015, lng: 0.0015 } // Medium movement
      case "industrial":
        return { lat: 0.0012, lng: 0.002 } // Medium-fast
      case "suburban":
        return { lat: 0.0018, lng: 0.0025 } // Medium
      default:
        return { lat: 0.001, lng: 0.002 }
    }
  }

  private getSpeedMultiplier(route: SimulationDevice["route"]): number {
    switch (route) {
      case "highway":
        return 1.2 // 20% faster
      case "downtown":
        return 0.6 // 40% slower
      case "residential":
        return 0.8 // 20% slower
      case "industrial":
        return 1.0 // Normal
      case "suburban":
        return 0.9 // 10% slower
      default:
        return 1.0
    }
  }

  private getBaseSpeed(route: SimulationDevice["route"]): number {
    switch (route) {
      case "highway":
        return 65
      case "downtown":
        return 25
      case "residential":
        return 35
      case "industrial":
        return 45
      case "suburban":
        return 40
      default:
        return 40
    }
  }

  private simulateMovement(device: SimulationDevice) {
    // Add some randomness and drift
    const drift = 0.1
    device.direction.lat += (Math.random() - 0.5) * drift
    device.direction.lng += (Math.random() - 0.5) * drift

    // Normalize direction
    const magnitude = Math.sqrt(
      device.direction.lat ** 2 + device.direction.lng ** 2
    )
    if (magnitude > 0) {
      device.direction.lat /= magnitude
      device.direction.lng /= magnitude
    }

    // Apply movement based on speed
    const speed = device.currentMetrics.speed
    const movementScale = (speed / 100) * device.speedMultiplier * 0.0001

    device.currentLocation.lat += device.direction.lat * movementScale
    device.currentLocation.lng += device.direction.lng * movementScale

    // Keep within reasonable bounds (San Francisco area)
    device.currentLocation.lat = Math.max(37.7, Math.min(37.8, device.currentLocation.lat))
    device.currentLocation.lng = Math.max(-122.5, Math.min(-122.3, device.currentLocation.lng))

    // Occasionally reverse direction (simulate route changes)
    if (Math.random() < 0.05) {
      device.direction.lat *= -1
      device.direction.lng *= -1
    }
  }

  private simulateMetrics(device: SimulationDevice) {
    const baseSpeed = this.getBaseSpeed(device.route)

    // Speed varies by route type with realistic variation
    const speedVariation = (Math.random() - 0.5) * 15
    const targetSpeed = baseSpeed * device.speedMultiplier + speedVariation
    device.currentMetrics.speed = Math.max(0, Math.min(100, targetSpeed))

    // Temperature varies with speed and ambient conditions
    const ambientTemp = 75
    const speedFactor = device.currentMetrics.speed * 0.15
    const variation = (Math.random() - 0.5) * 10
    device.currentMetrics.temperature = Math.round(
      ambientTemp + speedFactor + variation
    )

    // Fuel decreases over time (simulate consumption)
    if (device.currentMetrics.speed > 0) {
      const consumption =
        (device.currentMetrics.speed / 1000) * device.speedMultiplier +
        Math.random() * 0.05
      device.currentMetrics.fuel = Math.max(0, device.currentMetrics.fuel - consumption)
    }

    // Occasionally simulate refueling
    if (device.currentMetrics.fuel < 10 && Math.random() < 0.1) {
      device.currentMetrics.fuel = 100
      console.log(`Device ${device.id} refueled`)
    }

    // Humidity varies slightly
    device.currentMetrics.humidity = Math.max(
      20,
      Math.min(80, device.currentMetrics.humidity + (Math.random() - 0.5) * 5)
    )

    // Simulate traffic conditions (affects speed)
    if (Math.random() < 0.1) {
      // Traffic jam
      device.currentMetrics.speed *= 0.3
    } else if (Math.random() < 0.05) {
      // Clear road
      device.currentMetrics.speed *= 1.2
    }
  }

  private async generateAndSendTelemetry(device: SimulationDevice) {
    this.simulateMovement(device)
    this.simulateMetrics(device)

    const telemetryData = {
      deviceId: device.id,
      timestamp: Date.now(),
      location: { ...device.currentLocation },
      metrics: { ...device.currentMetrics },
    }

    try {
      // Save to database
      await insertTelemetry(telemetryData)

      // Emit via Socket.IO
      emitTelemetryUpdate(telemetryData)
    } catch (error) {
      console.error(`Error sending telemetry for ${device.id}:`, error)
    }
  }

  async start() {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    console.log("🚀 Starting fleet simulation...")

    // Register all devices
    for (const device of this.devices.values()) {
      try {
        await upsertDevice(
          device.id,
          device.name,
          device.type,
          device.currentLocation,
          device.currentMetrics
        )
      } catch (error) {
        console.error(`Error registering device ${device.id}:`, error)
      }
    }

    // Start simulation interval
    this.interval = setInterval(() => {
      if (this.isRunning) {
        this.devices.forEach((device) => {
          this.generateAndSendTelemetry(device).catch((error) => {
            console.error(`Error in simulation for ${device.id}:`, error)
          })
        })
      }
    }, this.updateInterval)

    console.log(`✅ Simulation started with ${this.devices.size} devices`)
  }

  stop() {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false

    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }

    console.log("🛑 Simulation stopped")
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      deviceCount: this.devices.size,
    }
  }
}

// Singleton instance
let simulationEngine: SimulationEngine | null = null

export function getSimulationEngine(): SimulationEngine {
  if (!simulationEngine) {
    simulationEngine = new SimulationEngine()
  }
  return simulationEngine
}

