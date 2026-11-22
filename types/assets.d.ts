// Metro resolves imported assets to a numeric asset ID.
declare module "*.wav" {
  const asset: number;
  export default asset;
}

declare module "*.otf" {
  const asset: number;
  export default asset;
}
