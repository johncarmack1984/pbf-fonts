import { $ } from "bun";

import "dotenv/config";
import { logError } from "./log-error";

const bucket = process.env.OUTPUT_BUCKET ?? "newearth-public";

const sync = async () => {
  try {
    console.time("sync");
    return await $`aws s3 sync ./output s3://${bucket} --exclude "*.DS_Store" --exclude "README.md" --exclude "geofabrik/**/*" --exclude "**/ne-draft/**/*" --exclude "pmtiles/regions/**" --exclude="zip/**"`;
  } catch (error) {
    logError(error);
  } finally {
    console.timeEnd("sync");
  }
};

if (import.meta.main) await sync();

export { sync };
