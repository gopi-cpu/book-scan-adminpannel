export type ItemType = "scan" | "pathology" | "package";
export type AgeBand = "all" | "u30" | "30-45" | "45-60" | "60p";
export type Gender = "all" | "men" | "women";
export type Season = "all" | "summer" | "monsoon" | "winter";
export type Modality = "CT" | "MRI" | "X-Ray" | "Ultrasound" | "Other";
export type BodyPart = "Spine" | "Brain" | "Chest" | "Joints" | "Abdomen";

export interface CatalogItem {
  slug: string;
  order: number;
  type: ItemType;
  name: string;
  group: string;
  icon: string;
  colorClass: string;
  was: number;
  now: number;
  age: AgeBand;
  gender: Gender;
  season: Season;
  modality?: Modality;
  bodyPart?: BodyPart;
  meta: string;
  description: string;
  popular?: boolean;
  featured?: boolean;
}
