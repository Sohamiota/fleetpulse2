// IoT Device Simulator for FleetPulse
// This script simulates multiple fleet vehicles sending telemetry data

const io = require("socket.io-client")

// Configuration
const SERVER_URL = "http://localhost:3000"
const TELEMETRY_ENDPOINT = "/api/telemetry"
const UPDATE_INTERVAL = 2000 // 2 seconds

// Fleet configuration
const FLEET_DEVICES = [
  {
    id: "van-001",
    name: "Delivery Van 001",
    type: "delivery",
    baseLocation: { lat: 37.7749, lng: -122.4194 },
    route: "downtown",
  },
  {
    id: "van-002",
    name: "Delivery Van 002",
    type: "delivery",
    baseLocation: { lat: 37.7849, lng: -122.4094 },
    route: "mission",
  },
  {
    id: "truck-001",
    name: "Cargo Truck 001",
    type: "cargo",
    baseLocation: { lat: 37.7649, lng: -122.4294 },
    route: "highway",
  },
  {
    id: "van-003",
    name: "Delivery Van 003",
    type: "delivery",
    baseLocation: { lat: 37.7549, lng: -122.4394 },
    route: "residential",
  },
  {
    id: "truck-002",
    name: "Cargo Truck 002",
    type: "cargo",
    baseLocation: { lat: 37.7949, lng: -122.3994 },
    route: "industrial",
  },
]

class DeviceSimulator {
  constructor(device) {
    this.device = device
    this.currentLocation = { ...device.baseLocation }
    this.currentMetrics = {
      temperature: 75,
      speed: 0,
      fuel: 100,
      humidity: 50,
    }
    this.isRunning = false
    this.socket = null
  }

  connect() {
    this.socket = io(SERVER_URL)

    this.socket.on("connect", () => {
      console.log(`✅ Device ${this.device.id} connected to server`)
      this.registerDevice()
    })

    this.socket.on("disconnect", () => {
      console.log(`❌ Device ${this.device.id} disconnected from server`)
    })

    this.socket.on("error", (error) => {
      console.error(`🚨 Socket error for ${this.device.id}:`, error)
    })
  }

  async registerDevice() {
    try {
      const response = await fetch(`${SERVER_URL}/api/devices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: this.device.id,
          name: this.device.name,
          type: this.device.type,
          location: this.currentLocation,
          metrics: this.currentMetrics,
        }),
      })

      if (response.ok) {
        console.log(`📝 Device ${this.device.id} registered successfully`)
      }
    } catch (error) {
      console.error(`❌ Failed to register device ${this.device.id}:`, error)
    }
  }

  generateTelemetryData() {
    // Simulate realistic movement patterns
    this.simulateMovement()
    this.simulateMetrics()

    return {
      deviceId: this.device.id,
      timestamp: Date.now(),
      location: {
        lat: this.currentLocation.lat,
        lng: this.currentLocation.lng,
      },
      metrics: {
        temperature: this.currentMetrics.temperature,
        speed: this.currentMetrics.speed,
        fuel: this.currentMetrics.fuel,
        humidity: this.currentMetrics.humidity,
      },
    }
  }

  simulateMovement() {
    // Simulate movement based on route type
    const movementRange = this.getMovementRange()

    // Add some randomness to movement
    const latChange = (Math.random() - 0.5) * movementRange.lat
    const lngChange = (Math.random() - 0.5) * movementRange.lng

    this.currentLocation.lat += latChange
    this.currentLocation.lng += lngChange

    // Keep within reasonable bounds (San Francisco area)
    this.currentLocation.lat = Math.max(37.7, Math.min(37.8, this.currentLocation.lat))
    this.currentLocation.lng = Math.max(-122.5, Math.min(-122.3, this.currentLocation.lng))
  }

  getMovementRange() {
    switch (this.device.route) {
      case "highway":
        return { lat: 0.002, lng: 0.005 } // Faster movement
      case "downtown":
        return { lat: 0.001, lng: 0.001 } // Slower, more constrained
      case "residential":
        return { lat: 0.0015, lng: 0.0015 } // Medium movement
      default:
        return { lat: 0.001, lng: 0.002 }
    }
  }

  simulateMetrics() {
    // Simulate realistic sensor readings

    // Speed varies by route type and time
    const baseSpeed = this.getBaseSpeed()
    this.currentMetrics.speed = Math.max(0, baseSpeed + (Math.random() - 0.5) * 20)

    // Temperature varies with speed and ambient conditions
    const ambientTemp = 75
    const speedFactor = this.currentMetrics.speed * 0.1
    this.currentMetrics.temperature = Math.round(ambientTemp + speedFactor + (Math.random() - 0.5) * 10)

    // Fuel decreases over time (simulate consumption)
    if (this.currentMetrics.speed > 0) {
      const consumption = this.currentMetrics.speed / 1000 + Math.random() * 0.1
      this.currentMetrics.fuel = Math.max(0, this.currentMetrics.fuel - consumption)
    }

    // Humidity varies slightly
    this.currentMetrics.humidity = Math.max(20, Math.min(80, this.currentMetrics.humidity + (Math.random() - 0.5) * 5))

    // Occasionally reset fuel (simulate refueling)
    if (this.currentMetrics.fuel < 10 && Math.random() < 0.1) {
      this.currentMetrics.fuel = 100
      console.log(`⛽ Device ${this.device.id} refueled`)
    }
  }

  getBaseSpeed() {
    switch (this.device.route) {
      case "highway":
        return 65
      case "downtown":
        return 25
      case "residential":
        return 35
      case "industrial":
        return 45
      default:
        return 40
    }
  }

  async sendTelemetry() {
    const telemetryData = this.generateTelemetryData()

    try {
      // Send via HTTP API
      const response = await fetch(`${SERVER_URL}${TELEMETRY_ENDPOINT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(telemetryData),
      })

      if (response.ok) {
        // Also emit via WebSocket for real-time updates
        if (this.socket && this.socket.connected) {
          this.socket.emit("telemetry-update", telemetryData)
        }

        console.log(
          `📡 ${this.device.id}: Speed=${telemetryData.metrics.speed}mph, Temp=${telemetryData.metrics.temperature}°F, Fuel=${telemetryData.metrics.fuel}%`,
        )
      } else {
        console.error(`❌ Failed to send telemetry for ${this.device.id}`)
      }
    } catch (error) {
      console.error(`🚨 Error sending telemetry for ${this.device.id}:`, error)
    }
  }

  start() {
    if (this.isRunning) return

    this.isRunning = true
    console.log(`🚀 Starting simulation for ${this.device.id}`)

    this.connect()

    this.interval = setInterval(() => {
      if (this.isRunning) {
        this.sendTelemetry()
      }
    }, UPDATE_INTERVAL)
  }

  stop() {
    if (!this.isRunning) return

    this.isRunning = false
    console.log(`🛑 Stopping simulation for ${this.device.id}`)

    if (this.interval) {
      clearInterval(this.interval)
    }

    if (this.socket) {
      this.socket.disconnect()
    }
  }
}

// Main simulation controller
class FleetSimulator {
  constructor() {
    this.simulators = []
    this.isRunning = false
  }

  initialize() {
    console.log("🏁 Initializing FleetPulse Device Simulator")
    console.log(`📊 Fleet size: ${FLEET_DEVICES.length} devices`)
    console.log(`⏱️  Update interval: ${UPDATE_INTERVAL}ms`)
    console.log("─".repeat(50))

    this.simulators = FLEET_DEVICES.map((device) => new DeviceSimulator(device))
  }

  start() {
    if (this.isRunning) {
      console.log("⚠️  Simulation is already running")
      return
    }

    this.isRunning = true
    console.log("🚀 Starting fleet simulation...")

    this.simulators.forEach((simulator) => {
      setTimeout(() => {
        simulator.start()
      }, Math.random() * 2000) // Stagger startup
    })

    // Handle graceful shutdown
    process.on("SIGINT", () => {
      console.log("\n🛑 Received SIGINT, shutting down gracefully...")
      this.stop()
      process.exit(0)
    })
  }

  stop() {
    if (!this.isRunning) return

    this.isRunning = false
    console.log("🛑 Stopping fleet simulation...")

    this.simulators.forEach((simulator) => {
      simulator.stop()
    })

    console.log("✅ Fleet simulation stopped")
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      deviceCount: this.simulators.length,
      activeDevices: this.simulators.filter((s) => s.isRunning).length,
    }
  }
}

// CLI interface
if (require.main === module) {
  const simulator = new FleetSimulator()
  simulator.initialize()

  const command = process.argv[2]

  switch (command) {
    case "start":
      simulator.start()
      break
    case "stop":
      simulator.stop()
      break
    case "status":
      console.log(simulator.getStatus())
      break
    default:
      console.log("Usage: node device-simulator.js [start|stop|status]")
      console.log("  start  - Start the fleet simulation")
      console.log("  stop   - Stop the fleet simulation")
      console.log("  status - Show simulation status")
  }
}

module.exports = FleetSimulator
