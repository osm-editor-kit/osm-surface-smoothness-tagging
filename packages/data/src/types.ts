// Hand-written schema for the catalogue. The generated src/generated/catalogue.ts
// is type-checked against `Catalogue`, so a shape drift breaks the build.

export interface SmoothnessLevel {
  /** OSM `smoothness` tag value, e.g. "excellent". */
  osmValue: string
  /** Short English label (from StreetComplete strings.xml). */
  title: string | null
  /** "Usable by" vehicle emoji. */
  emoji: string | null
  /** Package-relative path to the vehicle SVG, e.g. "icons/skateboard.svg". */
  vehicleIcon: string | null
}

export interface SurfaceInfo {
  /** OSM `surface` tag value, e.g. "asphalt". */
  osmValue: string
  title: string | null
  /** Package-relative path to the surface JPEG, e.g. "images/surface_asphalt.jpg". */
  icon: string | null
  /** Whether StreetComplete asks the smoothness quest for this surface. */
  smoothnessQuest: boolean
}

export interface MatrixCell {
  /** Package-relative path to the reference JPEG. */
  photo: string
  description: string | null
}

export interface Attribution {
  /** Package-relative path of the attributed asset. */
  file: string
  license: string
  source: string
}

export interface CatalogueMeta {
  source: string
  generatedBy: string
  counts: Record<string, number>
}

export interface Catalogue {
  version: string
  meta: CatalogueMeta
  /** Keyed by OSM smoothness value. */
  smoothnessLevels: Record<string, SmoothnessLevel>
  /** Keyed by OSM surface value. */
  surfaces: Record<string, SurfaceInfo>
  /** Tag value → canonical surface value (e.g. "concrete:plates" → "concrete"). */
  surfaceAliases: Record<string, string>
  surfacesForSmoothnessQuest: string[]
  /** surface value → smoothness value → cell. Only cells with a photo are present. */
  smoothnessMatrix: Record<string, Record<string, MatrixCell>>
  attribution: Attribution[]
}
