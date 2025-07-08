import { NextResponse } from "next/server"

// Mock device data - in production, this would come from your database
const mockDevices = [
  {
    id: "van-001",
    name: "Delivery Van 001",
    type: "delivery",
    status: "online" as const,
    location: { lat: 37.7749, lng: -122.4194 },
    metrics: { temperature: 75, speed: 45, fuel: 68 },
    lastUpdate: new Date().toISOString(),
  },
  {
    id: "van-002",
    name: "Delivery Van 002",
    type: "delivery",
    status: "online" as const,
    location: { lat: 37.7849, lng: -122.4094 },
    metrics: { temperature: 82, speed: 52, fuel: 34 },
    lastUpdate: new Date().toISOString(),
  },
  {
    id: "truck-001",
    name: "Cargo Truck 001",
    type: "cargo",
    status: "online" as const,
    location: { lat: 37.7649, lng: -122.4294 },
    metrics: { temperature: 78, speed: 38, fuel: 89 },
    lastUpdate: new Date().toISOString(),
  },
]

export async function GET() {
  return NextResponse.json({ devices: mockDevices })
}

export async function POST(request: Request) {
  const body = await request.json()

  // In production, save to database
  const newDevice = {
    id: body.deviceId,
    name: body.name || `Device ${body.deviceId}`,
    type: body.type || "unknown",
    status: "online" as const,
    location: body.location || { lat: 37.7749, lng: -122.4194 },
    metrics: body.metrics || { temperature: 70, speed: 0, fuel: 100 },
    lastUpdate: new Date().toISOString(),
  }

  mockDevices.push(newDevice)

  return NextResponse.json({ success: true, device: newDevice })
}
