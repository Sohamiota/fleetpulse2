interface Device {
  id: string
  name: string
  type: string
  status: "online" | "offline" | "warning"
  location: { lat: number; lng: number }
  metrics: {
    temperature: number
    speed: number
    fuel: number
    humidity?: number
  }
  lastUpdate: string
}

interface TelemetryData {
  deviceId: string
  timestamp: number
  location: { lat: number; lng: number }
  metrics: {
    temperature: number
    speed: number
    fuel: number
    humidity?: number
  }
}

interface Alert {
  id: string
  deviceId: string
  type: "speed" | "temperature" | "fuel" | "geofence"
  message: string
  severity: "low" | "medium" | "high"
  timestamp: number
}

class InMemoryStore {
  private devices: Map<string, Device> = new Map()
  private telemetry: Map<string, TelemetryData[]> = new Map()
  private alerts: Alert[] = []

  // Device operations
  getAllDevices(): Device[] {
    return Array.from(this.devices.values())
  }

  getDeviceById(deviceId: string): Device | null {
    return this.devices.get(deviceId) || null
  }

  upsertDevice(device: Device): Device {
    this.devices.set(device.id, device)
    return device
  }

  updateDeviceStatus(deviceId: string, status: Device["status"]): void {
    const device = this.devices.get(deviceId)
    if (device) {
      device.status = status
      device.lastUpdate = new Date().toISOString()
    }
  }

  // Telemetry operations
  insertTelemetry(data: TelemetryData): void {
    if (!this.telemetry.has(data.deviceId)) {
      this.telemetry.set(data.deviceId, [])
    }
    const history = this.telemetry.get(data.deviceId)!
    history.push(data)
    // Keep only last 1000 records per device
    if (history.length > 1000) {
      history.shift()
    }
  }

  getTelemetryHistory(deviceId: string, limit: number = 100): TelemetryData[] {
    const history = this.telemetry.get(deviceId) || []
    return history.slice(-limit).reverse()
  }

  // Alert operations
  insertAlert(alert: Alert): Alert {
    this.alerts.unshift(alert)
    // Keep only last 500 alerts
    if (this.alerts.length > 500) {
      this.alerts.pop()
    }
    return alert
  }

  getAlerts(deviceId?: string, limit: number = 100): Alert[] {
    let alerts = this.alerts
    if (deviceId) {
      alerts = alerts.filter((a) => a.deviceId === deviceId)
    }
    return alerts.slice(0, limit)
  }
}

let inMemoryStore: InMemoryStore | null = null

export function getInMemoryStore(): InMemoryStore {
  if (!inMemoryStore) {
    inMemoryStore = new InMemoryStore()

    // Initialize with sample devices
    const sampleDevices: Device[] = [
      {
        id: "van-001",
        name: "Delivery Van 001",
        type: "delivery",
        status: "online",
        location: { lat: 37.7749, lng: -122.4194 },
        metrics: { temperature: 75, speed: 45, fuel: 68, humidity: 55 },
        lastUpdate: new Date().toISOString(),
      },
      {
        id: "van-002",
        name: "Delivery Van 002",
        type: "delivery",
        status: "online",
        location: { lat: 37.7849, lng: -122.4094 },
        metrics: { temperature: 82, speed: 52, fuel: 34, humidity: 48 },
        lastUpdate: new Date().toISOString(),
      },
      {
        id: "truck-001",
        name: "Cargo Truck 001",
        type: "cargo",
        status: "warning",
        location: { lat: 37.7649, lng: -122.4294 },
        metrics: { temperature: 92, speed: 67, fuel: 22, humidity: 40 },
        lastUpdate: new Date().toISOString(),
      },
      {
        id: "truck-002",
        name: "Cargo Truck 002",
        type: "cargo",
        status: "online",
        location: { lat: 37.758, lng: -122.435 },
        metrics: { temperature: 79, speed: 58, fuel: 77, humidity: 60 },
        lastUpdate: new Date().toISOString(),
      },
      {
        id: "van-003",
        name: "Delivery Van 003",
        type: "delivery",
        status: "online",
        location: { lat: 37.769, lng: -122.445 },
        metrics: { temperature: 70, speed: 33, fuel: 88, humidity: 52 },
        lastUpdate: new Date().toISOString(),
      },
      {
        id: "ev-001",
        name: "Electric Shuttle 001",
        type: "shuttle",
        status: "online",
        location: { lat: 37.781, lng: -122.405 },
        metrics: { temperature: 68, speed: 40, fuel: 95, humidity: 47 },
        lastUpdate: new Date().toISOString(),
      },
    ]

    sampleDevices.forEach((device) => {
      inMemoryStore!.upsertDevice(device)
    })
  }
  return inMemoryStore
}
