import { performance } from "node:perf_hooks";
import {
  NoiseGenerator,
  HeightmapChunk,
  VoxelRegion,
  TerrainEngine
} from "../dist/index.mjs";

console.log("=== @crustdev/synthetix Performance Benchmarks ===");

const initialMem = process.memoryUsage().heapUsed;

// 1. Noise Throughput Benchmark
{
  const noise = new NoiseGenerator(12345);
  const iterations = 250_000;
  const start = performance.now();
  let acc = 0;
  for (let i = 0; i < iterations; i++) {
    acc += noise.fbm2D(i * 0.01, i * 0.02, 4, 0.5, 2.0);
  }
  const elapsed = performance.now() - start;
  const rate = Math.round((iterations / elapsed) * 1000);
  console.log(`- 2D fBm Noise (4 octaves): ${iterations.toLocaleString()} samples in ${elapsed.toFixed(2)}ms (${rate.toLocaleString()} samples/sec) [checksum: ${acc.toFixed(2)}]`);
}

// 2. Heightmap Chunk Generation Benchmark (64x64 and 128x128)
{
  const engine = new TerrainEngine({ seed: 9876 });

  for (const res of [32, 64, 128]) {
    const runs = 20;
    const times = [];
    for (let r = 0; r < runs; r++) {
      const t0 = performance.now();
      engine.generateChunk({ resolution: res, octaves: 4 });
      times.push(performance.now() - t0);
    }
    const avg = times.reduce((a, b) => a + b, 0) / runs;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const vertCount = res * res;
    console.log(`- Chunk (${res}x${res} = ${vertCount.toLocaleString()} verts): avg ${avg.toFixed(2)}ms, min ${min.toFixed(2)}ms, max ${max.toFixed(2)}ms`);
  }
}

// 3. Voxel Region Density Sampling (32x32x32 = 32,768 voxels)
{
  const noise = new NoiseGenerator(54321);
  const start = performance.now();
  const region = new VoxelRegion(noise, { sizeX: 32, sizeY: 32, sizeZ: 32 });
  const elapsed = performance.now() - start;
  const totalVoxels = region.voxels.length;
  const voxelRate = Math.round((totalVoxels / elapsed) * 1000);
  console.log(`- 3D Voxel Density (${totalVoxels.toLocaleString()} voxels): ${elapsed.toFixed(2)}ms (${voxelRate.toLocaleString()} voxels/sec)`);
}

// 4. Memory Heap Delta
const finalMem = process.memoryUsage().heapUsed;
const heapDeltaMB = ((finalMem - initialMem) / (1024 * 1024)).toFixed(2);
console.log(`- Total Heap Delta: ${heapDeltaMB} MB (Budget: <18 MB)`);
console.log("==================================================");
