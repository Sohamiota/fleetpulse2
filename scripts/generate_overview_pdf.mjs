import fs from "fs"
import path from "path"
import PDFDocument from "pdfkit"

const sections = [
  {
    title: "App UI (app/page.tsx)",
    items: [
      "FleetDashboard component holds device list, alerts, telemetry history, selected card, and simulation status state.",
      "On mount, fetches /api/simulation for current run state, connects to Socket.IO, and calls loadDevices().",
      "loadDevices() fetches /api/devices; if empty/fails it seeds mock devices via getSampleDevices() and populates telemetry history.",
      "When sockets receive telemetry-update events, the device array, history, status, and alerts are updated in real time.",
      "checkAlerts() evaluates speed, temperature, and fuel thresholds for every telemetry payload and pushes FleetAlert entries plus toast notifications.",
      "toggleSimulation() POSTs start/stop to /api/simulation so the SimulationEngine singleton can be controlled from the UI.",
      "A fallback interval uses simulateSampleDevice() every 2.5s when no backend data exists, keeping all stats live.",
      "Render tree: header with counts + Start/Stop button, global alert banner, SimulationVisualizer, and tabbed layout (Overview, Live Map, Analytics, Alerts).",
    ],
  },
  {
    title: "Supporting Components",
    items: [
      "SimulationVisualizer animates a truck icon with requestAnimationFrame, computing fleet averages and hottest vehicle via useMemo.",
      "FleetMap draws canvas grid + markers, handles clicks to show per-device info, and renders a status legend.",
      "DeviceCard, AlertPanel, TelemetryChart, and shadcn-based UI primitives render individual cards, alerts list, and charts.",
    ],
  },
  {
    title: "API Routes",
    items: [
      "app/api/devices: GET returns getAllDevices(); POST validates inputs with zod, upserts a device, and emits device-registered over sockets.",
      "app/api/simulation: POST start/stop hooks into SimulationEngine singleton; GET returns { isRunning, deviceCount }.",
      "app/api/telemetry, alerts, socket, etc. forward to their respective lib helpers (insertTelemetry, getAlerts, emitters).",
    ],
  },
  {
    title: "Simulation Engine (lib/simulation-engine.ts)",
    items: [
      "SimulationDevice definitions include base location, route type, movement range, and speed multiplier.",
      "start(): registers devices via upsertDevice(), then every 2s calls generateAndSendTelemetry for each device.",
      "simulateMovement() normalizes direction vectors, constrains lat/lng to SF bounds, and occasionally flips direction.",
      "simulateMetrics() varies speed by route, adjusts temperature, consumes fuel, applies humidity drift, and injects traffic events.",
      "generateAndSendTelemetry() writes to insertTelemetry() and broadcasts via emitTelemetryUpdate().",
      "stop() clears the interval; getStatus() exposes runtime info; getSimulationEngine() exports the singleton.",
    ],
  },
  {
    title: "Data Access Layer",
    items: [
      "lib/db.ts handles PostgreSQL pooling, fallback detection, and query() helper; if DATABASE_URL is missing/unreachable, useFallback=true.",
      "lib/db-devices / db-telemetry / db-alerts expose CRUD helpers that transparently choose between the real DB and the in-memory store.",
      "lib/db-fallback.ts hosts InMemoryStore with seeded sample devices plus telemetry and alert buffers.",
      "lib/sample-data.ts (frontend fallback) clones seeded devices and simulateSampleDevice() mutates metrics for UI-only mock telemetry.",
    ],
  },
  {
    title: "Real-time + Types",
    items: [
      "lib/socket-server.ts initializes Socket.IO, tracks connections, and exports emitTelemetryUpdate / emitDeviceRegistered helpers.",
      "types/fleet.ts centralizes Device, TelemetryData, and FleetAlert interfaces shared across client and server.",
      "hooks/use-toast.ts and shadcn UI utilities keep feedback consistent throughout the dashboard.",
    ],
  },
]

function addSection(doc, section) {
  doc.moveDown()
  doc.fontSize(16).fillColor("#111827").text(section.title, { underline: true })
  doc.moveDown(0.5)
  doc.fontSize(11).fillColor("#111827")

  section.items.forEach((item) => {
    doc.circle(doc.x - 6, doc.y + 5, 2).fillAndStroke("#2563eb", "#2563eb")
    doc.fillColor("#111827").text(`    ${item}`, {
      paragraphGap: 6,
      lineGap: 2,
    })
  })
}

function generatePdf() {
  const outputDir = path.join(process.cwd(), "docs")
  fs.mkdirSync(outputDir, { recursive: true })

  const doc = new PDFDocument({
    size: "LETTER",
    margin: 50,
    info: {
      Title: "FleetPulse Architecture Overview",
      Author: "FleetPulse Assistant",
    },
  })

  const outputPath = path.join(outputDir, "fleet-pulse-architecture.pdf")
  const stream = fs.createWriteStream(outputPath)
  doc.pipe(stream)

  doc.fontSize(22).fillColor("#111827").text("FleetPulse – Function-by-Function Overview")
  doc.moveDown(0.5)
  doc.fontSize(12).fillColor("#4b5563").text(
    "A step-by-step explanation of the key files, functions, and runtime flow powering the FleetPulse real-time dashboard.",
  )

  sections.forEach((section) => addSection(doc, section))

  doc.moveDown()
  doc.fontSize(10).fillColor("#6b7280").text("Generated on " + new Date().toLocaleString(), { align: "right" })

  doc.end()

  stream.on("finish", () => {
    console.log(`PDF created at ${outputPath}`)
  })
}

generatePdf()

