/**
 * @crustdev/synthetix - Noise Engine
 * Improved Perlin and Simplex gradient noise with Fractional Brownian Motion (fBm).
 */

import { PRNG } from "./prng";

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

function grad2(hash: number, x: number, y: number): number {
  const h = hash & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return (h & 1 ? -u : u) + (h & 2 ? -v : v);
}

function grad3(hash: number, x: number, y: number, z: number): number {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

export class NoiseGenerator {
  private perm: Uint8Array;

  constructor(seed: number = 482917) {
    const prng = new PRNG(seed);
    this.perm = prng.buildPermutationTable();
  }

  /**
   * Reseed the noise generator
   */
  public reseed(seed: number): void {
    const prng = new PRNG(seed);
    this.perm = prng.buildPermutationTable();
  }

  /**
   * Sample 2D Improved Perlin noise. Returns value in [-1, 1].
   */
  public perlin2D(x: number, y: number): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = fade(xf);
    const v = fade(yf);

    const aa = this.perm[this.perm[xi] + yi];
    const ab = this.perm[this.perm[xi] + yi + 1];
    const ba = this.perm[this.perm[xi + 1] + yi];
    const bb = this.perm[this.perm[xi + 1] + yi + 1];

    const x1 = lerp(grad2(aa, xf, yf), grad2(ba, xf - 1, yf), u);
    const x2 = lerp(grad2(ab, xf, yf - 1), grad2(bb, xf - 1, yf - 1), u);

    return lerp(x1, x2, v);
  }

  /**
   * Sample 3D Improved Perlin noise. Returns value in [-1, 1].
   */
  public perlin3D(x: number, y: number, z: number): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const zi = Math.floor(z) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const zf = z - Math.floor(z);

    const u = fade(xf);
    const v = fade(yf);
    const w = fade(zf);

    const a = this.perm[xi] + yi;
    const aa = this.perm[a] + zi;
    const ab = this.perm[a + 1] + zi;
    const b = this.perm[xi + 1] + yi;
    const ba = this.perm[b] + zi;
    const bb = this.perm[b + 1] + zi;

    return lerp(
      lerp(
        lerp(grad3(this.perm[aa], xf, yf, zf), grad3(this.perm[ba], xf - 1, yf, zf), u),
        lerp(grad3(this.perm[ab], xf, yf - 1, zf), grad3(this.perm[bb], xf - 1, yf - 1, zf), u),
        v
      ),
      lerp(
        lerp(grad3(this.perm[aa + 1], xf, yf, zf - 1), grad3(this.perm[ba + 1], xf - 1, yf, zf - 1), u),
        lerp(grad3(this.perm[ab + 1], xf, yf - 1, zf - 1), grad3(this.perm[bb + 1], xf - 1, yf - 1, zf - 1), u),
        v
      ),
      w
    );
  }

  /**
   * Multi-octave Fractional Brownian Motion (fBm) in 2D.
   * Returns normalized elevation in [0, 1].
   */
  public fbm2D(
    x: number,
    y: number,
    octaves: number = 4,
    persistence: number = 0.5,
    lacunarity: number = 2.0
  ): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.perlin2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    // Normalize from [-1, 1] to [0, 1]
    const normalized = (total / maxValue + 1) * 0.5;
    return Math.max(0, Math.min(1, normalized));
  }

  /**
   * Multi-octave Fractional Brownian Motion (fBm) in 3D.
   * Returns normalized density in [0, 1].
   */
  public fbm3D(
    x: number,
    y: number,
    z: number,
    octaves: number = 3,
    persistence: number = 0.5,
    lacunarity: number = 2.0
  ): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.perlin3D(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    const normalized = (total / maxValue + 1) * 0.5;
    return Math.max(0, Math.min(1, normalized));
  }
}
