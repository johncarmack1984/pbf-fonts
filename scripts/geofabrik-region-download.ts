import { $ } from "bun";

import { existsSync } from "node:fs";

const pbfs = [
  "north-america/us",
  "north-america/us-northeast",
  "north-america/us-south",
  "north-america/us/connecticut",
  "north-america/us/delaware",
  "north-america/us/district-of-columbia",
  "north-america/us/florida",
  "north-america/us/maine",
  "north-america/us/massachusetts",
  "north-america/us/new-york",
  "north-america/us/pennsylvania",
];

const makePath = async (pbf: string) => {
  const path = pbf.split("/");
  const filename = `${path.pop()}`;
  let outputdir = "./output/geofabrik";
  for (const segment of path) {
    outputdir = `${outputdir}/${segment}`;
    if (!existsSync(outputdir)) {
      await $`mkdir -p ${outputdir}`;
    }
  }
  const filepath = `${outputdir}/${filename}.osm.pbf`;
  return filepath;
};
const downloadPBF = async (pbf: string, filepath: string) => {
  if (!existsSync(filepath)) {
    const url = `https://download.geofabrik.de/${pbf}-latest.osm.pbf`;
    const tag = `${pbf}-download`;
    try {
      console.time(tag);
      await $`curl "${url}" --output ${filepath}`;
    } catch (error) {
      await $`echo "ERROR"`;
      console.error(error);
    } finally {
      console.timeEnd(tag);
    }
  }
};

const fetchPbf = async (pbf: string) => {
  console.time(pbf);
  try {
    const filepath = await makePath(pbf);
    await downloadPBF(pbf, filepath);
  } catch (error) {
    console.error(error);
  } finally {
    console.timeEnd(pbf);
  }
};

const main = async () => {
  const tag = "geofabrik-region-download";
  try {
    console.time(tag);
    const promises = pbfs.map(fetchPbf);
    await Promise.all(promises);
  } catch (error) {
    console.error(error);
  } finally {
    console.timeEnd(tag);
  }
};

main();
