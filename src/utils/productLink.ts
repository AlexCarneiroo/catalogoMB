import type { Location } from 'react-router-dom'

type ProductLocationState = {
  backgroundLocation?: Location
}

export function backgroundLocation(location: Location): Location | undefined {
  const state = location.state as ProductLocationState | null
  if (state?.backgroundLocation) return state.backgroundLocation
  if (location.pathname.startsWith('/produto/')) return undefined
  return location
}

export function productLinkState(location: Location): ProductLocationState | undefined {
  const background = backgroundLocation(location)
  return background ? { backgroundLocation: background } : undefined
}
