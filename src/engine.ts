/**
 * @crustdev/synthetix - Main Terrain Engine
 * Unified facade class orchestrating PRNG, Noise, Biomes, and Chunks.
 */

import { NoiseGenerator } from "./noise";
import { CellularNoise } from "./cellular";
import { BiomeRamp } from "./biome";
import { HeightmapChunk, type ChunkOptions } from "./heightmap";
import { VoxelRegion, type VoxelRegionOptions } from "./voxel";

export type TerrainEngineConfig = {
  seed?: number;
  octaves?: number;
  persistence?: number;
  lacunarity?: number;
  worldScale?: number;
  biome?: BiomeRamp;
};

export class TerrainEngine {
  private noise: NoiseGenerator;
  private cellular: CellularNoise;
  public readonly config: Required<TerrainEngineConfig>;

  constructor(config: TerrainEngineConfig = {}) {
    const seed = config.seed ?? 482917;
    const octaves = config.octaves ?? 4;
    const persistence = config.persistence ?? 0.5;
    const lacunarity = config.lacunarity ?? 2.0;
    const worldScale = config.worldScale ?? 100;
    const biome = config.biome ?? BiomeRamp.Alpine;

    this.config = {
      seed,
      octaves,
      persistence,
      lacunarity,
      worldScale,
      biome,
    };

    this.noise = new NoiseGenerator(seed);
    this.cellular = new CellularNoise(seed);
  }

  /**
   * Reseeds the terrain generator
   */
  public reseed(seed: number): void {
    this.config.seed = seed;
    this.noise.reseed(seed);
    this.cellular = new CellularNoise(seed);
  }

  /**
   * Generates a 2D terrain heightmap chunk
   */
  public generateChunk(options: ChunkOptions = {}): HeightmapChunk {
    return new HeightmapChunk(this.noise, {
      octaves: options.octaves ?? this.config.octaves,
      persistence: options.persistence ?? this.config.persistence,
      lacunarity: options.lacunarity ?? this.config.lacunarity,
      worldScale: options.worldScale ?? this.config.worldScale,
      ...options,
    });
  }

  /**
   * Generates a 3D voxel density region
   */
  public generateVoxelRegion(options: VoxelRegionOptions = {}): VoxelRegion {
    return new VoxelRegion(this.noise, options);
  }

  /**
   * Sample 2D continuous noise at world coordinates (x, y)
   */
  public sampleElevation(x: number, y: number): number {
    return this.noise.fbm2D(
      x / this.config.worldScale,
      y / this.config.worldScale,
      this.config.octaves,
      this.config.persistence,
      this.config.lacunarity
    );
  }

  /**
   * Sample cellular/voronoi ridges at world coordinates (x, y)
   */
  public sampleCellular(x: number, y: number) {
    return this.cellular.sample2D(x / this.config.worldScale, y / this.config.worldScale);
  }
}
