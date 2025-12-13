"use client"

import dynamic from "next/dynamic"
import type { MapCanvasProps } from "./MapCanvas"

const MapCanvas = dynamic(() => import("./MapCanvas"), {
    ssr: false,
})

export default function InteractiveMap(props: MapCanvasProps) {
    return <MapCanvas {...props} />
}

