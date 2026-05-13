import { dlopen, FFIType, ptr } from 'bun:ffi'

const { symbols } = dlopen('./libtun.so', {
    tun_open:  { args: [FFIType.cstring],                        returns: FFIType.int32_t },
    tun_read:  { args: [FFIType.int32_t, FFIType.ptr, FFIType.int32_t], returns: FFIType.int32_t },
    tun_write: { args: [FFIType.int32_t, FFIType.ptr, FFIType.int32_t], returns: FFIType.int32_t },
})

export function openTun(ifname: string): number {
    return symbols.tun_open(Buffer.from(ifname + '\0')) as number
}

export function tunRead(fd: number, buf: Buffer): number {
    return symbols.tun_read(fd, ptr(buf), buf.length) as number
}

export function tunWrite(fd: number, buf: Buffer): number {
    return symbols.tun_write(fd, ptr(buf), buf.length) as number
}