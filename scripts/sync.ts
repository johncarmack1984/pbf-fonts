import { $ } from "bun";

import "dotenv/config";

const sync = async () => {
  return await $`aws s3 sync ./output s3://${process.env.AWS_OUTPUT_ROOT} --exclude "*" --include "./output/fonts/**/*" --include "./output/geofabrik/**/*" --include "./output/geojson/**/*" --include "./output/mapbox/**/*" --include "./output/mbtiles/**/*" --include "./output/ne/**/*" --include "./output/osm/**/*" --include "./output/pmtiles/**/*" --include "./output/sprite/**/*" --include "./output/zip/**/*" --include "*.mbtiles" --include "*.pmtiles" --exclude "README.md" --delete`;
};

if (import.meta.main) {
  console.time("sync");
  await sync();
  console.timeEnd("sync");
}
export { sync };
