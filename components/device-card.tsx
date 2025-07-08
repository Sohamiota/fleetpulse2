"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, Thermometer, Gauge, Fuel, MapPin } from "lucide-react"

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

interface DeviceCardProps {
  device: Device
  onClick: () => void
  isSelected: boolean
}

export function DeviceCard({ device, onClick, isSelected }: DeviceCardProps) {
  const getStatusColor = (status: Device["status"]) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "warning":
        return "bg-orange-500"
      case "offline":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusVariant = (status: Device["status"]) => {
    switch (status) {
      case "online":
        return "default"
      case "warning":
        return "secondary"
      case "offline":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            <CardTitle className="text-lg">{device.name}</CardTitle>
          </div>
          <Badge variant={getStatusVariant(device.status)}>
            <div className={`w-2 h-2 rounded-full mr-1 ${getStatusColor(device.status)}`} />
            {device.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <span>{device.metrics.speed} mph</span>
          </div>
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-muted-foreground" />
            <span>{device.metrics.temperature}°F</span>
          </div>
          <div className="flex items-center gap-2">
            <Fuel className="h-4 w-4 text-muted-foreground" />
            <span>{device.metrics.fuel}%</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">
              {device.location.lat.toFixed(3)}, {device.location.lng.toFixed(3)}
            </span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Last update: {new Date(device.lastUpdate).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  )
}
