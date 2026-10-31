/**
 * @crustdev/synthetix - Biome System
 * Color ramp gradient mapping and Whittaker temperature/moisture classifications.
 */

export type RGB = [number, number, number];

export type RampStop = {
  elevation: number;
  rgb: RGB;
};

export class BiomeRamp {
  public readonly id: string;
  public readonly label: string;
  public readonly stops: readonly RampStop[];

  constructor(id: string, label: string, stops: RampStop[]) {
    this.id = id;
    this.label = label;
    // Ensure stops are sorted by elevation
    this.stops = [...stops].sort((a, b) => a.elevation - b.elevation);
  }

  /**
   * Evaluate RGB color at normalized elevation t in [0, 1]
   */
  public evaluate(t: number): RGB {
    const clamped = Math.max(0, Math.min(1, t));
    const stops = this.stops;

    if (clamped <= stops[0].elevation) {
      return stops[0].rgb;
    }
    if (clamped >= stops[stops.length - 1].elevation) {
      return stops[stops.length - 1].rgb;
    }

    for (let i = 0; i < stops.length - 1; i++) {
      const s0 = stops[i];
      const s1 = stops[i + 1];
      if (clamped >= s0.elevation && clamped <= s1.elevation) {
        const factor = (clamped - s0.elevation) / (s1.elevation - s0.elevation);
        return [
          Math.round(s0.rgb[0] + factor * (s1.rgb[0] - s0.rgb[0])),
          Math.round(s0.rgb[1] + factor * (s1.rgb[1] - s0.rgb[1])),
          Math.round(s0.rgb[2] + factor * (s1.rgb[2] - s0.rgb[2])),
        ];
      }
    }

    return stops[stops.length - 1].rgb;
  }

  /**
   * Convert evaluation to CSS rgb string
   */
  public evaluateCss(t: number): string {
    const [r, g, b] = this.evaluate(t);
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Pre-packaged Biome Ramps
   */
  public static readonly Alpine = new BiomeRamp("alpine", "Alpine", [
    { elevation: 0.0, rgb: [8, 22, 48] },
    { elevation: 0.28, rgb: [18, 78, 122] },
    { elevation: 0.36, rgb: [194, 176, 122] },
    { elevation: 0.48, rgb: [46, 112, 62] },
    { elevation: 0.64, rgb: [78, 92, 58] },
    { elevation: 0.78, rgb: [118, 118, 112] },
    { elevation: 1.0, rgb: [236, 240, 244] },
  ]);

  public static readonly Atoll = new BiomeRamp("atoll", "Atoll", [
    { elevation: 0.0, rgb: [6, 18, 42] },
    { elevation: 0.42, rgb: [12, 86, 132] },
    { elevation: 0.52, rgb: [28, 168, 168] },
    { elevation: 0.58, rgb: [214, 196, 132] },
    { elevation: 0.72, rgb: [52, 132, 72] },
    { elevation: 1.0, rgb: [36, 78, 48] },
  ]);

  public static readonly Caldera = new BiomeRamp("caldera", "Caldera", [
    { elevation: 0.0, rgb: [48, 8, 6] },
    { elevation: 0.22, rgb: [168, 36, 12] },
    { elevation: 0.4, rgb: [42, 28, 26] },
    { elevation: 0.62, rgb: [78, 68, 62] },
    { elevation: 0.82, rgb: [132, 118, 98] },
    { elevation: 1.0, rgb: [214, 196, 168] },
  ]);

  public static readonly Boreal = new BiomeRamp("boreal", "Boreal", [
    { elevation: 0.0, rgb: [14, 32, 48] },
    { elevation: 0.3, rgb: [48, 78, 86] },
    { elevation: 0.46, rgb: [86, 108, 78] },
    { elevation: 0.68, rgb: [36, 64, 48] },
    { elevation: 0.86, rgb: [168, 178, 176] },
    { elevation: 1.0, rgb: [232, 238, 240] },
  ]);

  public static readonly Dune = new BiomeRamp("dune", "Dune", [
    { elevation: 0.0, rgb: [72, 42, 22] },
    { elevation: 0.28, rgb: [168, 108, 48] },
    { elevation: 0.52, rgb: [206, 164, 92] },
    { elevation: 0.74, rgb: [176, 122, 68] },
    { elevation: 0.9, rgb: [132, 86, 52] },
    { elevation: 1.0, rgb: [92, 64, 42] },
  ]);

  public static readonly Abyssal = new BiomeRamp("abyssal", "Abyssal", [
    { elevation: 0.0, rgb: [4, 6, 12] },
    { elevation: 0.3, rgb: [18, 12, 38] },
    { elevation: 0.55, rgb: [48, 24, 76] },
    { elevation: 0.75, rgb: [106, 64, 247] },
    { elevation: 0.9, rgb: [0, 255, 170] },
    { elevation: 1.0, rgb: [240, 255, 250] },
  ]);
}
