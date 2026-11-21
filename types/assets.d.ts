// Metro resolves imported audio files to an asset ID.
declare module "*.wav" {
  const asset: number;
  export default asset;
}
