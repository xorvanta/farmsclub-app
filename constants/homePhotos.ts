/**
 * Built-in home page photography, used only where the admin hasn't uploaded FarmsClub's own photos
 * (Storefront content → Hero photos) and no featured farm has a cover photo yet. Mood photos of
 * nurseries and planting — never captioned as a FarmsClub farm, and never on a farm or listing.
 * Unsplash licence (free commercial use, no attribution needed): https://unsplash.com/license.
 * Each URL was checked to load (HTTP 200) and looked at before use.
 */
export const HOME_PHOTOS = {
  polytunnel: "https://images.unsplash.com/photo-1708796705570-33fd29ef67d0", // long polytunnel of young green plants
  trellis: "https://images.unsplash.com/photo-1644615339756-0afa02e886f0", // trellised crop rows inside a polytunnel
  seedlings: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2", // seedlings in rows of nursery pots
  planting: "https://images.unsplash.com/photo-1611843467160-25afb8df1074", // hands planting seedlings in a bed
} as const;
