import { $ } from "bun";

import { existsSync } from "node:fs";
import { makePath } from "./make-path";
import { logError } from "./log-error";
import { upload } from "./upload";

const pbfs = [
  "africa",
  "antarctica",
  "asia",
  "australia-oceania",
  "central-america",
  "europe",
  "north-america",
  "south-america",
  "north-america/canada/ontario",
  "north-america/us",
  "north-america/us-northeast",
  "north-america/us-south",
  "north-america/us/connecticut",
  "north-america/us/delaware",
  "north-america/us/district-of-columbia",
  "north-america/us/florida",
  "north-america/us/maine",
  "north-america/us/maryland",
  "north-america/us/massachusetts",
  "north-america/us/new-york",
  "north-america/us/pennsylvania",
];

const downloadPBF = async (pbf: string) => {
  const filepath = `${await makePath(pbf, "./output/geofabrik/pbf")}.osm.pbf`;
  if (!existsSync(filepath)) {
    try {
      console.time(filepath);
      await $`curl "https://download.geofabrik.de/${pbf}-latest.osm.pbf" --output ${filepath}`;
    } catch (error) {
      logError(error);
    } finally {
      console.timeEnd(filepath);
    }
  }
  return filepath;
};

const tilemaker = async (name: string, input: string) => {
  const filepath = `${await makePath(
    name,
    "./output/pmtiles/regions"
  )}.pmtiles`;
  if (!existsSync(filepath)) {
    try {
      console.time(filepath);
      await $`tilemaker ${input} --output ${filepath} --config ./scripts/tilemaker.json --process ./scripts/process.lua`;
    } catch (error) {
      logError(error);
    } finally {
      console.timeEnd(filepath);
    }
  }
};

const pbfToPmtiles = async (pbf: string) => {
  try {
    console.time(pbf);
    const filepath = await downloadPBF(pbf);
    await tilemaker(pbf, filepath);
  } catch (error) {
    logError(error);
  } finally {
    console.timeEnd(pbf);
  }
};

const main = async () => {
  const tag = "geofabrik-region-download";
  try {
    console.time(tag);
    const promises = pbfs.map(pbfToPmtiles);
    await Promise.all(promises);
    upload();
  } catch (error) {
    logError(error);
  } finally {
    console.timeEnd(tag);
  }
};

main();
