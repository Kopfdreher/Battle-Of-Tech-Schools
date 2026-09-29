import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Listing } from '../types.ts'
import { MAP_LAYERS, layerPoints, type MapLayerId } from '../lib/mapLayers.ts'

type Pin = {
  number: number
  listing: Listing
  tone: 'good' | 'bad'
}

type Props = {
  pins: Pin[]
  selectedId: string | null
  /** Layers currently drawn on the map (subset of required criteria). */
  layers: MapLayerId[]
  /** Only the user's required criteria — never show other layer controls. */
  availableLayers: MapLayerId[]
  onSelect: (id: string) => void
  onToggleLayer: (id: MapLayerId) => void
  onToggleAll: () => void
}

function pinIcon(number: number, active: boolean, tone: 'good' | 'bad') {
  return L.divIcon({
    className: 'dash-pin-wrap',
    html: `<span class="dash-pin ${tone}${active ? ' active' : ''}">${number}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

function layerIcon(label: string, color: string) {
  return L.divIcon({
    className: 'dash-layer-wrap',
    html: `<span class="dash-layer-dot" style="--dot:${color}" title="${label}"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

export function DashboardMap({
  pins,
  selectedId,
  layers,
  availableLayers,
  onSelect,
  onToggleLayer,
  onToggleAll,
}: Props) {
  const host = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerGroup = useRef<L.LayerGroup | null>(null)
  const visibleLayers = layers.filter((id) => availableLayers.includes(id))
  const availableMeta = MAP_LAYERS.filter((layer) => availableLayers.includes(layer.id))
  const allSelected =
    availableLayers.length > 0 && availableLayers.every((id) => visibleLayers.includes(id))

  useEffect(() => {
    if (!host.current || mapRef.current) return
    const map = L.map(host.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([52.52, 13.405], 12)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 18,
    }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    layerGroup.current = L.layerGroup().addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      layerGroup.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const group = layerGroup.current
    if (!map || !group) return
    group.clearLayers()

    const bounds: L.LatLngTuple[] = []
    for (const pin of pins) {
      const marker = L.marker([pin.listing.lat, pin.listing.lng], {
        icon: pinIcon(pin.number, pin.listing.id === selectedId, pin.tone),
        zIndexOffset: pin.listing.id === selectedId ? 400 : 200,
      })
        .bindTooltip(`${pin.number}. ${pin.listing.address}`, { direction: 'top', offset: [0, -12] })
        .on('click', () => onSelect(pin.listing.id))
      group.addLayer(marker)
      bounds.push([pin.listing.lat, pin.listing.lng])

      for (const layerId of visibleLayers) {
        const meta = MAP_LAYERS.find((item) => item.id === layerId)
        if (!meta) continue
        for (const point of layerPoints(pin.listing, layerId)) {
          if (point.kind === 'noise') {
            const circle = L.circle([point.lat, point.lng], {
              radius: point.radius * 4,
              color: meta.color,
              fillColor: meta.color,
              fillOpacity: pin.listing.id === selectedId ? 0.22 : 0.1,
              weight: 1,
              opacity: 0.7,
            }).bindTooltip(`${pin.number}. ${point.label} · ${point.detail}`)
            group.addLayer(circle)
          } else {
            const marker = L.marker([point.lat, point.lng], {
              icon: layerIcon(point.label, meta.color),
              interactive: true,
            }).bindTooltip(`${pin.number}. ${meta.label}: ${point.label} (${point.detail})`)
            group.addLayer(marker)
            bounds.push([point.lat, point.lng])
          }
        }
      }
    }

    requestAnimationFrame(() => map.invalidateSize())
  }, [pins, selectedId, visibleLayers, onSelect])

  useEffect(() => {
    const map = mapRef.current
    if (!map || pins.length === 0) return
    const bounds: L.LatLngTuple[] = pins.map((pin) => [pin.listing.lat, pin.listing.lng])
    for (const pin of pins) {
      for (const layerId of visibleLayers) {
        for (const point of layerPoints(pin.listing, layerId)) {
          bounds.push([point.lat, point.lng])
        }
      }
    }
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 })
  }, [pins, visibleLayers])

  return (
    <section className="map-panel" aria-label="Place map">
      <div className="map-stage">
        <div className="map-canvas" ref={host} />
        <aside className="map-layers" aria-label="Your required criteria on the map">
          <div className="layer-head">
            <p className="kicker">Your criteria</p>
            {availableLayers.length > 0 ? (
              <button type="button" className="text-button" onClick={onToggleAll}>
                {allSelected ? 'Clear all' : 'Show all'}
              </button>
            ) : null}
          </div>
          {availableLayers.length === 0 ? (
            <p className="hint">Pick required criteria under Requirements to highlight them here.</p>
          ) : (
            <>
              <p className="hint">Only your required criteria are highlighted on the map.</p>
              <ul className="layer-list">
                {availableMeta.map((layer) => {
                  const checked = visibleLayers.includes(layer.id)
                  return (
                    <li key={layer.id}>
                      <label className="layer-item">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleLayer(layer.id)}
                        />
                        <span className="layer-swatch" style={{ background: layer.color }} aria-hidden="true" />
                        <span>
                          <strong>{layer.label}</strong>
                          <small>{layer.detail}</small>
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </aside>
      </div>
    </section>
  )
}
