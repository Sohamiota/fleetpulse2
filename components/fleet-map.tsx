"use client"

import type React from "react"

import type { Device } from "@/types/fleet"
import { useEffect, useRef, useState } from "react"

interface FleetMapProps {
  devices: Device[]
}

export default function FleetMap({ devices }: FleetMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [mapBounds, setMapBounds] = useState({
    minLat: 37.7,
    maxLat: 37.8,
    minLng: -122.5,
    maxLng: -122.3,
  })

  useEffect(() => {
    if (!canvasRef.current || devices.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw grid background
    drawGrid(ctx, canvas.width, canvas.height)

    // Draw devices
    devices.forEach((device) => {
      drawDevice(ctx, device, canvas.width, canvas.height)
    })

    // Draw legend
    drawLegend(ctx, canvas.width, canvas.height)
  }, [devices, mapBounds])

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 1

    // Draw vertical lines
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // Draw horizontal lines
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * height
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Draw border
    ctx.strokeStyle = "#9ca3af"
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, width, height)
  }

  const drawDevice = (ctx: CanvasRenderingContext2D, device: Device, width: number, height: number) => {
    // Convert lat/lng to canvas coordinates
    const x = ((device.location.lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * width
    const y = height - ((device.location.lat - mapBounds.minLat) / (mapBounds.maxLat - mapBounds.minLat)) * height

    // Get status color
    const color = getStatusColor(device.status)

    // Draw device marker
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, 8, 0, 2 * Math.PI)
    ctx.fill()

    // Draw white border
    ctx.strokeStyle = "white"
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw device ID
    ctx.fillStyle = "#374151"
    ctx.font = "12px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(device.id, x, y - 15)

    // Draw speed indicator
    ctx.fillStyle = "#6b7280"
    ctx.font = "10px sans-serif"
    ctx.fillText(`${device.metrics.speed}mph`, x, y + 25)
  }

  const drawLegend = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const legendX = width - 150
    const legendY = 20

    // Legend background
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
    ctx.fillRect(legendX - 10, legendY - 10, 140, 80)
    ctx.strokeStyle = "#d1d5db"
    ctx.strokeRect(legendX - 10, legendY - 10, 140, 80)

    // Legend title
    ctx.fillStyle = "#374151"
    ctx.font = "14px sans-serif"
    ctx.textAlign = "left"
    ctx.fillText("Device Status", legendX, legendY + 5)

    // Legend items
    const statuses = [
      { status: "online", label: "Online", color: "#10b981" },
      { status: "warning", label: "Warning", color: "#f59e0b" },
      { status: "offline", label: "Offline", color: "#ef4444" },
    ]

    statuses.forEach((item, index) => {
      const y = legendY + 25 + index * 15

      // Draw color circle
      ctx.fillStyle = item.color
      ctx.beginPath()
      ctx.arc(legendX + 8, y, 4, 0, 2 * Math.PI)
      ctx.fill()

      // Draw label
      ctx.fillStyle = "#374151"
      ctx.font = "12px sans-serif"
      ctx.fillText(item.label, legendX + 20, y + 4)
    })
  }

  const getStatusColor = (status: Device["status"]) => {
    switch (status) {
      case "online":
        return "#10b981"
      case "warning":
        return "#f59e0b"
      case "offline":
        return "#ef4444"
      default:
        return "#6b7280"
    }
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Find clicked device
    const clickedDevice = devices.find((device) => {
      const deviceX = ((device.location.lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * canvas.width
      const deviceY =
        canvas.height -
        ((device.location.lat - mapBounds.minLat) / (mapBounds.maxLat - mapBounds.minLat)) * canvas.height

      const distance = Math.sqrt((x - deviceX) ** 2 + (y - deviceY) ** 2)
      return distance <= 12 // Click tolerance
    })

    if (clickedDevice) {
      setSelectedDevice(selectedDevice === clickedDevice.id ? null : clickedDevice.id)
    } else {
      setSelectedDevice(null)
    }
  }

  const selectedDeviceData = devices.find((d) => d.id === selectedDevice)

  return (
    <div className="relative h-full w-full bg-gray-50">
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-pointer"
        onClick={handleCanvasClick}
        style={{ display: "block" }}
      />

      {/* Device Info Panel */}
      {selectedDeviceData && (
        <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg border max-w-xs">
          <h3 className="font-semibold text-lg mb-2">{selectedDeviceData.name}</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Status:</span>
              <span
                className={`font-medium ${selectedDeviceData.status === "online"
                  ? "text-green-600"
                  : selectedDeviceData.status === "warning"
                    ? "text-orange-600"
                    : "text-red-600"
                  }`}
              >
                {selectedDeviceData.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Speed:</span>
              <span>{selectedDeviceData.metrics.speed} mph</span>
            </div>
            <div className="flex justify-between">
              <span>Temperature:</span>
              <span>{selectedDeviceData.metrics.temperature}°F</span>
            </div>
            <div className="flex justify-between">
              <span>Fuel:</span>
              <span>{selectedDeviceData.metrics.fuel}%</span>
            </div>
            <div className="flex justify-between">
              <span>Location:</span>
              <span className="text-xs">
                {selectedDeviceData.location.lat.toFixed(4)}, {selectedDeviceData.location.lng.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Last Update:</span>
              <span className="text-xs">{new Date(selectedDeviceData.lastUpdate).toLocaleTimeString()}</span>
            </div>
          </div>
          <button onClick={() => setSelectedDevice(null)} className="mt-2 text-xs text-gray-500 hover:text-gray-700">
            Click to close
          </button>
        </div>
      )}

      {/* Map Info */}
      <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded shadow text-sm text-gray-600">
        San Francisco Fleet Area • {devices.length} Active Devices
      </div>
    </div>
  )
}
