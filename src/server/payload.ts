import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

/** Shared Payload Local API instance (cached by Payload across hot reloads). */
export function getPayloadClient(): Promise<Payload> {
  return getPayload({ config })
}
