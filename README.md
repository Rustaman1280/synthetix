# @crustdev/synthetix

Deterministic procedural terrain generation, multi-octave noise, and voxel biome engine SDK by **CrustDev Labs**.

[![npm version](https://img.shields.io/npm/v/@crustdev/synthetix.svg?style=flat-square)](https://www.npmjs.com/package/@crustdev/synthetix)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-blue.svg?style=flat-square)](https://labs.crusts.dev)

Official software laboratory portal: [https://labs.crusts.dev](https://labs.crusts.dev)

---

## Features

- **Zero External Dependencies:** Under 18 KB minified. Zero bloat. Works in Node.js, modern browsers, Web Workers, Bun, and Deno.
- **Deterministic PRNG:** Fast Mulberry32 generator ensures identical terrain generation across different platforms and seeds.
- **Multi-Octave fBm Noise:** 2D & 3D Improved Perlin and Simplex gradient noise with configurable octaves, persistence, and lacunarity.
- **Cellular / Voronoi Noise:** Euclidean, Manhattan, and Chebyshev metrics for natural biome cells, crystal strata, and cave networks.
- **Biome Color Ramps:** Built-in color palettes (`Alpine`, `Atoll`, `Caldera`, `Boreal`, `Dune`, `Abyssal`) with smooth linear interpolation.
- **2D Heightmap Chunks:** Generates normalized elevation maps, surface normals, and slope angles with central difference calculations.
- **Roblox WriteVoxels Export:** Generates typed Luau table syntax ready for Roblox `workspace.Terrain:WriteVoxels()`.

---

## Installation

```bash
npm install @crustdev/synthetix
```

Or using pnpm / yarn / bun:

```bash
pnpm add @crustdev/synthetix
# or
bun add @crustdev/synthetix
```

---

## Quickstart

### 1. Basic Terrain Generation

```typescript
import { TerrainEngine, BiomeRamp } from "@crustdev/synthetix";

// Initialize engine with seed and biome
const engine = new TerrainEngine({
  seed: 482917,
  octaves: 4,
  persistence: 0.52,
  lacunarity: 2.0,
  biome: BiomeRamp.Caldera,
});

// Sample elevation at continuous world coordinates
const elevation = engine.sampleElevation(12.5, 45.2);
console.log("Elevation:", elevation); // [0.0, 1.0]
```

### 2. Generate Heightmap Chunks for WebGL / Canvas

```typescript
// Generate a 64x64 grid chunk
const chunk = engine.generateChunk({
  chunkX: 0,
  chunkZ: 0,
  resolution: 64,
  worldScale: 120,
});

console.log("Vertices:", chunk.data.vertexCount); // 4096
console.log("Compute time:", chunk.data.computeTimeMs, "ms");

// Export to raw RGBA Uint8ClampedArray for Canvas ImageData or WebGL textures
const rgbaBuffer = chunk.toRgbaBuffer(BiomeRamp.Alpine);
```

### 3. Generate 3D Voxel Regions for Roblox Studio

```typescript
const voxels = engine.generateVoxelRegion({
  sizeX: 16,
  sizeY: 16,
  sizeZ: 16,
  scale: 24,
});

// Outputs typed Luau code for Roblox
const luauCode = voxels.toRobloxTerrainTable();
console.log(luauCode);
```

---

## Architecture Overview

| Module | Export | Description |
|---|---|---|
| `TerrainEngine` | Class | High-level orchestrator for procedural generation |
| `BiomeRamp` | Class | Color gradient mapping with built-in presets |
| `HeightmapChunk` | Class | 2D terrain slices with surface normals and slope |
| `VoxelRegion` | Class | 3D voxel density sampling with Roblox export |
| `NoiseGenerator` | Class | Perlin 2D/3D & multi-octave fBm calculations |
| `CellularNoise` | Class | Voronoi / Worley noise for biomes & crystals |
| `PRNG` | Class | Deterministic 32-bit pseudo-random generator |

---

## License

MIT (c) 2026 CrustDev Labs (Jumarr). Built by creators, owned together.
