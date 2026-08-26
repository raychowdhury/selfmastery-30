#!/usr/bin/env python3
"""
Draws the SelfMastery app icon: an open progress ring with a mark at its head.

No text, strong silhouette at small sizes, and it reads as "a path you are part
way along" rather than a generic checkmark. Rendered at 4x and downsampled for
antialiasing, then written with the stdlib's zlib — no image dependencies.

    python3 scripts/generate-app-icon.py

Replace the output with final artwork from a designer before release; the asset
name and dimensions stay the same.
"""
import math
import struct
import zlib
from pathlib import Path

SIZE = 1024
SS = 4  # supersampling factor
N = SIZE * SS

BG_TOP = (0x1C, 0x1F, 0x48)
BG_BOTTOM = (0x10, 0x11, 0x20)
TRACK = (0x3A, 0x36, 0x5C)
ACCENT = (0x9C, 0x8F, 0xE4)

CENTRE = N / 2
RADIUS = N * 0.30
THICKNESS = N * 0.085

# Leave a gap at the bottom so the ring reads as a path, not a closed circle.
START_ANGLE = math.radians(130)
SWEEP = math.radians(280)
PROGRESS = 0.72


def blend(base, colour, alpha):
    return tuple(round(b + (c - b) * alpha) for b, c in zip(base, colour))


def coverage(distance, edge, softness):
    """1 inside, 0 outside, smooth across `softness` pixels."""
    return max(0.0, min(1.0, (edge - distance) / softness + 0.5))


def render():
    rows = []
    soft = SS * 1.5
    inner = RADIUS - THICKNESS / 2
    outer = RADIUS + THICKNESS / 2

    head_angle = START_ANGLE + SWEEP * PROGRESS
    head = (CENTRE + RADIUS * math.cos(head_angle), CENTRE + RADIUS * math.sin(head_angle))

    for y in range(N):
        row = bytearray()
        gradient = y / (N - 1)
        background = blend(BG_TOP, BG_BOTTOM, gradient)

        for x in range(N):
            dx, dy = x - CENTRE, y - CENTRE
            distance = math.hypot(dx, dy)
            pixel = background

            # Ring band: inside the annulus and within the swept angle.
            band = min(coverage(distance, outer, soft), coverage(inner, distance, soft))
            if band > 0:
                angle = math.atan2(dy, dx) % (2 * math.pi)
                delta = (angle - START_ANGLE) % (2 * math.pi)
                if delta <= SWEEP:
                    filled = delta <= SWEEP * PROGRESS
                    pixel = blend(pixel, ACCENT if filled else TRACK, band)

            # Rounded head of the progress arc.
            head_distance = math.hypot(x - head[0], y - head[1])
            cap = coverage(head_distance, THICKNESS / 2, soft)
            if cap > 0:
                pixel = blend(pixel, ACCENT, cap)

            row += bytes(pixel)
        rows.append(bytes(row))
    return rows


def downsample(rows):
    out = []
    for y in range(SIZE):
        row = bytearray()
        for x in range(SIZE):
            r = g = b = 0
            for sy in range(SS):
                source = rows[y * SS + sy]
                for sx in range(SS):
                    index = ((x * SS) + sx) * 3
                    r += source[index]
                    g += source[index + 1]
                    b += source[index + 2]
            count = SS * SS
            row += bytes((r // count, g // count, b // count))
        out.append(bytes(row))
    return out


def write_png(path, rows):
    raw = b"".join(b"\x00" + row for row in rows)

    def chunk(tag, data):
        payload = tag + data
        return struct.pack(">I", len(data)) + payload + struct.pack(">I", zlib.crc32(payload))

    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )
    Path(path).write_bytes(png)


if __name__ == "__main__":
    target = "ios/SelfMastery/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon.png"
    write_png(target, downsample(render()))
    print(f"Wrote {target} ({SIZE}x{SIZE})")
