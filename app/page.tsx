"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert as UIAlert, AlertDescription } from "@/components/ui/alert"
import { Truck, Thermometer, Gauge, AlertTriangle, Play, Pause } from "lucide-react"
import { TelemetryChart } from "@/components/telemetry-chart"
import { DeviceCard } from "@/components/device-card"
import { AlertPanel } from "@/components/alert-panel"
import { useToast } from "@/hooks/use-toast"
import io from "socket.io-client"

// Remove the dynamic import line and replace with:
import FleetMap from "@/components/fleet-map"

// Remove this line:
// const FleetMap = dynamic(() => import("@/components/fleet-map"), { ssr: false })

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

interface FleetAlert {
  id: string
  deviceId: string
  type: "speed" | "temperature" | "fuel" | "geofence"
  message: string
  severity: "low" | "medium" | "high"
  timestamp: number
}

export default function FleetDashboard() {
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [telemetryHistory, setTelemetryHistory] = useState<Record<string, TelemetryData[]>>({})
  const [alerts, setAlerts] = useState<FleetAlert[]>([])
  const [isSimulationRunning, setIsSimulationRunning] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Initialize Socket.IO connection
    const socket = io()

    // Listen for real-time telemetry updates
    socket.on("telemetry-update", (data: TelemetryData) => {
      setDevices((prev) =>
        prev.map((device) => {
          if (device.id === data.deviceId) {
            // Check for alerts
            checkAlerts(data)

            return {
              ...device,
              location: data.location,
              metrics: data.metrics,
              lastUpdate: new Date(data.timestamp).toISOString(),
              status: getDeviceStatus(data.metrics),
            }
          }
          return device
        }),
      )

      // Update telemetry history
      setTelemetryHistory((prev) => ({
        ...prev,
        [data.deviceId]: [
          ...(prev[data.deviceId] || []).slice(-50), // Keep last 50 readings
          data,
        ],
      }))
    })

    // Listen for new device registrations
    socket.on("device-registered", (device: Device) => {
      setDevices((prev) => [...prev, device])
      toast({
        title: "New Device Online",
        description: `${device.name} has joined the fleet`,
      })
    })

    // Load initial devices
    loadDevices()

    return () => {
      socket.disconnect()
    }
  }, [toast])

  const loadDevices = async () => {
    try {
      const response = await fetch("/api/devices")
      const data = await response.json()
      setDevices(data.devices || [])
    } catch (error) {
      console.error("Failed to load devices:", error)
    }
  }

  const getDeviceStatus = (metrics: TelemetryData["metrics"]): Device["status"] => {
    if (metrics.temperature > 85 || metrics.speed > 80 || metrics.fuel < 15) {
      return "warning"
    }
    return "online"
  }

  const checkAlerts = (data: TelemetryData) => {
    const newAlerts: FleetAlert[] = []

    if (data.metrics.speed > 80) {
      newAlerts.push({
        id: `${data.deviceId}-speed-${Date.now()}`,
        deviceId: data.deviceId,
        type: "speed",
        message: `Vehicle ${data.deviceId} exceeding speed limit: ${data.metrics.speed} mph`,
        severity: "high",
        timestamp: data.timestamp,
      })
    }

    if (data.metrics.temperature > 85) {
      newAlerts.push({
        id: `${data.deviceId}-temp-${Date.now()}`,
        deviceId: data.deviceId,
        type: "temperature",
        message: `High engine temperature detected: ${data.metrics.temperature}°F`,
        severity: "medium",
        timestamp: data.timestamp,
      })
    }

    if (data.metrics.fuel < 15) {
      newAlerts.push({
        id: `${data.deviceId}-fuel-${Date.now()}`,
        deviceId: data.deviceId,
        type: "fuel",
        message: `Low fuel warning: ${data.metrics.fuel}%`,
        severity: "medium",
        timestamp: data.timestamp,
      })
    }

    if (newAlerts.length > 0) {
      setAlerts((prev) => [...newAlerts, ...prev].slice(0, 100)) // Keep last 100 alerts

      newAlerts.forEach((alert) => {
        toast({
          title: "Fleet Alert",
          description: alert.message,
          variant: alert.severity === "high" ? "destructive" : "default",
        })
      })
    }
  }

  const toggleSimulation = async () => {
    try {
      const response = await fetch("/api/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isSimulationRunning ? "stop" : "start" }),
      })

      if (response.ok) {
        setIsSimulationRunning(!isSimulationRunning)
        toast({
          title: isSimulationRunning ? "Simulation Stopped" : "Simulation Started",
          description: isSimulationRunning ? "Fleet simulation has been stopped" : "Fleet simulation is now running",
        })
      }
    } catch (error) {
      console.error("Failed to toggle simulation:", error)
    }
  }

  const activeAlerts = alerts.filter(
    (alert) => Date.now() - alert.timestamp < 300000, // Last 5 minutes
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">FleetPulse</h1>
                <p className="text-sm text-muted-foreground">Real-time IoT Fleet Monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={isSimulationRunning ? "default" : "secondary"}>{devices.length} Devices</Badge>
              <Button
                onClick={toggleSimulation}
                variant={isSimulationRunning ? "destructive" : "default"}
                className="gap-2"
              >
                {isSimulationRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isSimulationRunning ? "Stop" : "Start"} Simulation
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="container mx-auto px-4 py-2">
          <UIAlert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {activeAlerts.length} active alert{activeAlerts.length > 1 ? "s" : ""} - Check the alerts panel for
              details
            </AlertDescription>
          </UIAlert>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="map">Live Map</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Fleet Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
                  <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{devices.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {devices.filter((d) => d.status === "online").length} online
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Speed</CardTitle>
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {devices.length > 0
                      ? Math.round(devices.reduce((acc, d) => acc + d.metrics.speed, 0) / devices.length)
                      : 0}{" "}
                    mph
                  </div>
                  <p className="text-xs text-muted-foreground">Fleet average</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Temperature</CardTitle>
                  <Thermometer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {devices.length > 0
                      ? Math.round(devices.reduce((acc, d) => acc + d.metrics.temperature, 0) / devices.length)
                      : 0}
                    °F
                  </div>
                  <p className="text-xs text-muted-foreground">Engine average</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeAlerts.length}</div>
                  <p className="text-xs text-muted-foreground">Last 5 minutes</p>
                </CardContent>
              </Card>
            </div>

            {/* Device Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {devices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onClick={() => setSelectedDevice(device.id)}
                  isSelected={selectedDevice === device.id}
                />
              ))}
            </div>

            {/* Selected Device Telemetry */}
            {selectedDevice && telemetryHistory[selectedDevice] && (
              <Card>
                <CardHeader>
                  <CardTitle>Telemetry History - {selectedDevice}</CardTitle>
                  <CardDescription>Real-time sensor data over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <TelemetryChart data={telemetryHistory[selectedDevice]} />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="map">
            <Card>
              <CardHeader>
                <CardTitle>Live Fleet Map</CardTitle>
                <CardDescription>Real-time vehicle positions and status</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[600px] w-full">
                  <FleetMap devices={devices} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Fleet Performance</CardTitle>
                  <CardDescription>Key metrics and trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Average Speed</span>
                      <span className="font-medium">
                        {devices.length > 0
                          ? Math.round(devices.reduce((acc, d) => acc + d.metrics.speed, 0) / devices.length)
                          : 0}{" "}
                        mph
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fuel Efficiency</span>
                      <span className="font-medium">
                        {devices.length > 0
                          ? Math.round(devices.reduce((acc, d) => acc + d.metrics.fuel, 0) / devices.length)
                          : 0}
                        % avg
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Temperature Range</span>
                      <span className="font-medium">
                        {devices.length > 0
                          ? `${Math.min(...devices.map((d) => d.metrics.temperature))}°F - ${Math.max(...devices.map((d) => d.metrics.temperature))}°F`
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alert Summary</CardTitle>
                  <CardDescription>Recent alert activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Speed Violations</span>
                      <span className="font-medium">{alerts.filter((a) => a.type === "speed").length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Temperature Warnings</span>
                      <span className="font-medium">{alerts.filter((a) => a.type === "temperature").length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fuel Alerts</span>
                      <span className="font-medium">{alerts.filter((a) => a.type === "fuel").length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts">
            <AlertPanel alerts={alerts} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
