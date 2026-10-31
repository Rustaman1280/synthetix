/**
 * @crustdev/synthetix - Heightmap Chunk Generator
 * 2D terrain grids with surface normals, slope calculations, and texture rasterization.
 */

import { NoiseGenerator } from "./noise";
import { BiomeRamp } from "./biome";

export type ChunkOptions = {
  chunkX?: number;
  chunkZ?: number;
  resolution?: number;
  worldScale?: number;
  heightScale?: number;
  octaves?: number;
  persistence?: number;
  lacunarity?: number;
};

export type HeightmapData = {
  resolution: number;
  elevations: Float32Array;
  normals: Float32Array; // 3 floats per vertex (nx, ny, nz)
  slopes: Float32Array;
  minElevation: number;
  maxElevation: number;
  vertexCount: number;
  computeTimeMs: number;
};

export class HeightmapChunk {
  public readonly data: HeightmapData;
  public readonly options: Required<ChunkOptions>;

  constructor(noise: NoiseGenerator, options: ChunkOptions = {}) {
    const startTime = performance.now();

    const chunkX = options.chunkX ?? 0;
    const chunkZ = options.chunkZ ?? 0;
    const resolution = options.resolution ?? 64;
    const worldScale = options.worldScale ?? 100;
    const heightScale = options.heightScale ?? 1;
    const octaves = options.octaves ?? 4;
    const persistence = options.persistence ?? 0.5;
    const lacunarity = options.lacunarity ?? 2.0;

    this.options = {
      chunkX,
      chunkZ,
      resolution,
      worldScale,
      heightScale,
      octaves,
      persistence,
      lacunarity,
    };

    const count = resolution * resolution;
    const elevations = new Float32Array(count);
    const normals = new Float32Array(count * 3);
    const slopes = new Float32Array(count);

    let minElevation = Infinity;
    let maxElevation = -Infinity;

    // 1. Sample elevations
    for (let z = 0; z < resolution; z++) {
      for (let x = 0; x < resolution; x++) {
        const wx = (chunkX * (resolution - 1) + x) / worldScale;
        const wz = (chunkZ * (resolution - 1) + z) / worldScale;

        const h = noise.fbm2D(wx, wz, octaves, persistence, lacunarity) * heightScale;
        const idx = z * resolution + x;
        elevations[idx] = h;

        if (h < minElevation) minElevation = h;
        if (h > maxElevation) maxElevation = h;
      }
    }

    // 2. Compute surface normals & slopes using central differences
    const step = 1 / worldScale;
    for (let z = 0; z < resolution; z++) {
      for (let x = 0; x < resolution; x++) {
        const idx = z * resolution + x;

        const left = x > 0 ? elevations[idx - 1] : elevations[idx];
        const right = x < resolution - 1 ? elevations[idx + 1] : elevations[idx];
        const down = z > 0 ? elevations[idx - resolution] : elevations[idx];
        const up = z < resolution - 1 ? elevations[idx + resolution] : elevations[idx];

        const dx = (right - left) / (2 * step);
        const dz = (up - down) / (2 * step);

        // Normal vector: cross([-1, 0, dx], [0, -1, dz])
        let nx = -dx;
        let ny = 1.0;
        let nz = -dz;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;

        nx /= len;
        ny /= len;
        nz /= len;

        const normIdx = idx * 3;
        normals[normIdx] = nx;
        normals[normIdx + 1] = ny;
        normals[normIdx + 2] = nz;

        // Slope is angle from vertical (0 = completely flat, 1 = completely vertical)
        slopes[idx] = Math.max(0, Math.min(1, 1 - ny));
      }
    }

    const computeTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    this.data = {
      resolution,
      elevations,
      normals,
      slopes,
      minElevation,
      maxElevation,
      vertexCount: count,
      computeTimeMs,
    };
  }

  /**
   * Get elevation at local grid coordinates (x, z)
   */
  public getElevation(x: number, z: number): number {
    const rx = Math.max(0, Math.min(this.options.resolution - 1, x));
    const rz = Math.max(0, Math.min(this.options.resolution - 1, z));
    return this.data.elevations[rz * this.options.resolution + rx];
  }

  /**
   * Render this chunk into an RGBA Uint8ClampedArray pixel buffer.
   * Compatible with HTML5 Canvas `new ImageData(buffer, res, res)` and WebGL textures.
   */
  public toRgbaBuffer(biome: BiomeRamp = BiomeRamp.Alpine): Uint8ClampedArray {
    const res = this.options.resolution;
    const pixels = new Uint8ClampedArray(res * res * 4);

    for (let i = 0; i < res * res; i++) {
      const elev = this.data.elevations[i];
      const [r, g, b] = biome.evaluate(elev);

      // Simple directional shading using surface normal
      const nx = this.data.normals[i * 3];
      const ny = this.data.normals[i * 3 + 1];
      const nz = this.data.normals[i * 3 + 2];

      // Light direction from top-left: [-0.6, 0.7, -0.4]
      const light = Math.max(0.2, (nx * -0.6 + ny * 0.7 + nz * -0.4));

      const pIdx = i * 4;
      pixels[pIdx] = Math.min(255, Math.round(r * light));
      pixels[pIdx + 1] = Math.min(255, Math.round(g * light));
      pixels[pIdx + 2] = Math.min(255, Math.round(b * light));
      pixels[pIdx + 3] = 255;
    }

    return pixels;
  }
}
