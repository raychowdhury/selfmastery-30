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

# A diagonal ground rather than a vertical one: it gives the mark depth without
# reading as a gradient-heavy icon at thumbnail size.
BG_TOP = (0x2A, 0x2C, 0x5E)
BG_BOTTOM = (0x0D, 0x0E, 0x1B)
TRACK = (0x43, 0x3E, 0x66)
ACCENT = (0xA6, 0x99, 0xEE)
ACCENT_DEEP = (0x7A, 0x6C, 0xC8)

CENTRE = N / 2
RADIUS = N * 0.295
# Thicker than looks right at full size — below 60px a thin ring disappears.
THICKNESS = N * 0.105

# Leave a gap at the bottom so the ring reads as a path, not a closed circle.
START_ANGLE = math.radians(132)
SWEEP = math.radians(276)
PROGRESS = 0.68


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
    tail = (CENTRE + RADIUS * math.cos(START_ANGLE), CENTRE + RADIUS * math.sin(START_ANGLE))
    track_end_angle = START_ANGLE + SWEEP
    track_end = (
        CENTRE + RADIUS * math.cos(track_end_angle),
        CENTRE + RADIUS * math.sin(track_end_angle),
    )

    for y in range(N):
        row = bytearray()

        for x in range(N):
            dx, dy = x - CENTRE, y - CENTRE
            distance = math.hypot(dx, dy)

            # Diagonal ground, brightest at the top-left.
            gradient = min(1.0, max(0.0, (x + y) / (2 * (N - 1))))
            pixel = blend(BG_TOP, BG_BOTTOM, gradient)

            # Ring band: inside the annulus and within the swept angle.
            band = min(coverage(distance, outer, soft), coverage(inner, distance, soft))
            if band > 0:
                angle = math.atan2(dy, dx) % (2 * math.pi)
                delta = (angle - START_ANGLE) % (2 * math.pi)
                if delta <= SWEEP:
                    if delta <= SWEEP * PROGRESS:
                        # The filled arc deepens as it travels, so the head of
                        # the progress reads as the leading edge.
                        travel = delta / (SWEEP * PROGRESS)
                        colour = blend(ACCENT_DEEP, ACCENT, travel)
                    else:
                        colour = TRACK
                    pixel = blend(pixel, colour, band)

            # Rounded caps at both ends, so the arc reads as a drawn stroke
            # rather than a wedge cut out of a disc.
            cap = coverage(math.hypot(x - head[0], y - head[1]), THICKNESS / 2, soft)
            if cap > 0:
                pixel = blend(pixel, ACCENT, cap)

            tail_cap = coverage(math.hypot(x - tail[0], y - tail[1]), THICKNESS / 2, soft)
            if tail_cap > 0:
                pixel = blend(pixel, ACCENT_DEEP, tail_cap)

            # The unfilled track gets a cap too, or its end reads as a chipped
            # wedge rather than the far end of the same stroke.
            track_cap = coverage(
                math.hypot(x - track_end[0], y - track_end[1]), THICKNESS / 2, soft
            )
            if track_cap > 0:
                pixel = blend(pixel, TRACK, track_cap)

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
