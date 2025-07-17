"use client"

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react"
import * as d3 from "d3"
import { toPng } from "html-to-image"
import { ZoomIn, ZoomOut, Move, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MindMapNode {
  id: string
  label: string
  children?: MindMapNode[]
}

interface MindMapProps {
  data: MindMapNode
}

export interface MindMapHandle {
  save: () => void
}

const MindMap = forwardRef<MindMapHandle, MindMapProps>(({ data }, ref) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })

  const handleSave = useCallback(() => {
    if (svgRef.current === null) {
      return
    }

    toPng(svgRef.current, { cacheBust: true, backgroundColor: "#000000" })
      .then((dataUrl) => {
        const link = document.createElement("a")
        link.download = "mind-map.png"
        link.href = dataUrl
        link.click()
      })
      .catch((err) => {
        console.error("Oops, something went wrong!", err)
      })
  }, [svgRef])

  useImperativeHandle(ref, () => ({
    save: handleSave,
  }))

  useEffect(() => {
    if (!svgRef.current) return

    const width = 1200
    const height = 800
    const nodeWidth = 120
    const nodeHeight = 40

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove()

    // Create hierarchy
    const root = d3.hierarchy(data)

    // Create tree layout
    const treeLayout = d3
      .tree<MindMapNode>()
      .size([height, width - 160])
      .nodeSize([nodeHeight * 2, nodeWidth * 2])

    // Apply layout
    treeLayout(root)

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(80, ${height / 2})`)

    // Create links
    svg
      .selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", (d) => {
        return `M${d.source.y},${d.source.x}
                C${(d.source.y + d.target.y) / 2},${d.source.x}
                 ${(d.source.y + d.target.y) / 2},${d.target.x}
                 ${d.target.y},${d.target.x}`
      })
      .attr("fill", "none")
      .attr("stroke", "#22d3ee")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.6)

    // Create node groups
    const nodes = svg
      .selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.y},${d.x})`)

    // Add node rectangles
    nodes
      .append("rect")
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("fill", (d) => {
        if (d.depth === 0) return "#22d3ee"
        if (d.depth === 1) return "#8b5cf6"
        return "rgba(255, 255, 255, 0.1)"
      })
      .attr("stroke", (d) => {
        if (d.depth === 0) return "#22d3ee"
        if (d.depth === 1) return "#8b5cf6"
        return "rgba(255, 255, 255, 0.3)"
      })

    // Add node text and update rect size
    nodes
      .append("text")
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("fill", (d) => (d.depth < 2 ? "#000" : "#fff"))
      .attr("font-size", (d) => (d.depth === 0 ? "14px" : "12px"))
      .attr("font-weight", (d) => (d.depth < 2 ? "bold" : "normal"))
      .text((d) => d.data.label)
      .each(function (d) {
        const textNode = d3.select(this)
        const bbox = (textNode.node() as SVGTextElement).getBBox()
        const padding = { x: 20, y: 10 }

        const rect = d3.select(this.parentNode as SVGGElement).select("rect")
        rect
          .attr("width", bbox.width + padding.x * 2)
          .attr("height", bbox.height + padding.y * 2)
          .attr("x", -bbox.width / 2 - padding.x)
          .attr("y", -bbox.height / 2 - padding.y)
      });

    // The old text wrapping logic is removed as it complicates things.
    // A simple text label is used for now. We can add better wrapping later if needed.

    // Setup zoom behavior
    const zoomBehavior = d3
      .zoom()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        svg.attr("transform", event.transform)
        setTransform({
          x: event.transform.x,
          y: event.transform.y,
          scale: event.transform.k,
        })
        setZoom(event.transform.k)
      })

    // Apply zoom behavior to the SVG
    d3.select(svgRef.current).call(zoomBehavior as any)

    // Center the view initially
    const initialTransform = d3.zoomIdentity.translate(80, height / 2).scale(1)
    d3.select(svgRef.current).call((zoomBehavior as any).transform, initialTransform)
  }, [data])

  const handleZoomIn = () => {
    if (!svgRef.current) return
    const zoomBehavior = d3.zoom()
    const newScale = Math.min(transform.scale + 0.2, 3)
    const newTransform = d3.zoomIdentity.translate(transform.x, transform.y).scale(newScale)
    d3.select(svgRef.current).call((zoomBehavior as any).transform, newTransform)
  }

  const handleZoomOut = () => {
    if (!svgRef.current) return
    const zoomBehavior = d3.zoom()
    const newScale = Math.max(transform.scale - 0.2, 0.5)
    const newTransform = d3.zoomIdentity.translate(transform.x, transform.y).scale(newScale)
    d3.select(svgRef.current).call((zoomBehavior as any).transform, newTransform)
  }

  const handlePanToggle = () => {
    setIsPanning(!isPanning)
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    if (!isPanning) {
      // Enable panning mode
      svg.style("cursor", "move")
    } else {
      // Disable panning mode
      svg.style("cursor", "default")
    }
  }

  return (
    <div className="relative h-full w-full" ref={containerRef}>
      <div className="absolute right-4 top-4 z-10 flex flex-col space-y-2">
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 rounded-full border-cyan-400 bg-black/50 text-cyan-400 hover:bg-cyan-400/10"
          onClick={handleZoomIn}
          title="放大"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 rounded-full border-cyan-400 bg-black/50 text-cyan-400 hover:bg-cyan-400/10"
          onClick={handleZoomOut}
          title="缩小"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className={`h-8 w-8 rounded-full bg-black/50 ${
            isPanning
              ? "border-pink-400 text-pink-400 hover:bg-pink-400/10"
              : "border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
          }`}
          onClick={handlePanToggle}
          title="平移"
        >
          <Move className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 rounded-full border-green-400 bg-black/50 text-green-400 hover:bg-green-400/10"
          onClick={handleSave}
          title="保存为PNG"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
      <div className="absolute bottom-4 left-4 z-10 rounded-md bg-black/50 px-2 py-1 text-xs text-white/70">
        缩放: {Math.round(zoom * 100)}%
      </div>
      <svg ref={svgRef} className="h-full w-full min-h-[600px] min-w-[1000px]"></svg>
    </div>
  )
})

MindMap.displayName = "MindMap"

export default MindMap
