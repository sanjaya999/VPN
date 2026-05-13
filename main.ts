import { execSync } from 'child_process'
import { importKey } from './connection/crypto'
import { Tunnel } from './connection/tunnel'
import type { TunnelConfig } from './types/types'

const [,, peerIp, keyHex] = Bun.argv

if (!peerIp || !keyHex) {
    console.error('Usage: bun main.ts <peer_ip> <hex_key>')
    process.exit(1)
}

// Validate AES-GCM key length before handing off to WebCrypto.
// AES requires exactly 16, 24, or 32 bytes (128 / 192 / 256-bit).
const rawKeyBytes = Buffer.from(keyHex, 'hex')
if (![16, 24, 32].includes(rawKeyBytes.length)) {
    console.error(
        `Invalid key: hex string decodes to ${rawKeyBytes.length} bytes.` +
        ` AES-GCM requires 16, 24, or 32 bytes` +
        ` (i.e. a hex string of 32, 48, or 64 characters).`
    )
    process.exit(1)
}

const key = await importKey(rawKeyBytes)

const config: TunnelConfig = {
    tunDevice:  'vpnTun',
    listenPort: 5555,
    key:        rawKeyBytes,
    peers: [{
        ip:        peerIp,
        port:      5555,
        publicKey: key
    }]
}

const tunnel = new Tunnel(config)

// Assign the TUN address AFTER the tunnel creates the device.
try {
    execSync('ip addr add 10.8.0.2/24 dev vpnTun', { stdio: 'pipe' })
} catch (e: any) {
    const msg: string = e.stderr?.toString() ?? e.message ?? ''
    if (!msg.includes('File exists') && !msg.includes('already assigned')) throw e
    console.log('TUN address already assigned — continuing.')
}
execSync('ip link set vpnTun up')

await tunnel.start()