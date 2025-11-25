import type { Device, TelemetryData } from "@/types/fleet"

const BASE_SAMPLE_DEVICES: Device[] = [
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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function getSampleDevices(): Device[] {
  return BASE_SAMPLE_DEVICES.map((device) => ({
    ...device,
    location: { ...device.location },
    metrics: { ...device.metrics },
    lastUpdate: new Date().toISOString(),
  }))
}

export function simulateSampleDevice(device: Device): { device: Device; telemetry: TelemetryData } {
  const speedDelta = (Math.random() - 0.5) * 10
  const speed = clamp(device.metrics.speed + speedDelta, 0, 85)
  const temperature = clamp(device.metrics.temperature + (Math.random() - 0.5) * 4 + speed * 0.05, 65, 115)
  const fuel = clamp(device.metrics.fuel - Math.random() * 1.2 - speed * 0.01, 5, 100)
  const humidity = clamp((device.metrics.humidity ?? 50) + (Math.random() - 0.5) * 2, 30, 70)

  const lat = clamp(device.location.lat + (Math.random() - 0.5) * 0.0007, 37.7, 37.8)
  const lng = clamp(device.location.lng + (Math.random() - 0.5) * 0.0007, -122.5, -122.3)

  const updatedDevice: Device = {
    ...device,
    status: fuel < 15 || temperature > 90 ? "warning" : "online",
    location: { lat, lng },
    metrics: {
      ...device.metrics,
      speed: Math.round(speed),
      temperature: Math.round(temperature),
      fuel: Math.round(fuel),
      humidity: Math.round(humidity),
    },
    lastUpdate: new Date().toISOString(),
  }

  const telemetry: TelemetryData = {
    deviceId: updatedDevice.id,
    timestamp: Date.now(),
    location: updatedDevice.location,
    metrics: updatedDevice.metrics,
  }

  return { device: updatedDevice, telemetry }
}

