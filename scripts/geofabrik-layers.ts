import { $ } from "bun";

import { existsSync } from "node:fs";

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

const makePath = async (pbf: string, targetDir: string) => {
  const path = pbf.split("/");
  const filename = `${path.pop()}`;
  let outputdir = targetDir;
  for (const segment of path) {
    outputdir = `${outputdir}/${segment}`;
    if (!existsSync(outputdir)) {
      await $`mkdir -p ${outputdir}`;
    }
  }
  return `${outputdir}/${filename}`;
};

const downloadPBF = async (pbf: string) => {
  const filepath = `${await makePath(pbf, "./output/geofabrik")}.osm.pbf`;
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
  return filepath;
};

const tilemaker = async (name: string, input: string) => {
  const filepath = `${await makePath(name, "./output/pmtiles")}.pmtiles`;
  if (!existsSync(filepath)) {
    try {
      console.time(filepath);
      await $`tilemaker ${input} --output ${filepath} --config ./layers/tilemaker.json --process ./scripts/process.lua`;
    } catch (error) {
      console.error(error);
    } finally {
      console.timeEnd(filepath);
    }
  }
};

const pbfToPmtiles = async (pbf: string) => {
  console.time(pbf);
  try {
    const filepath = await downloadPBF(pbf);
    await tilemaker(pbf, filepath);
  } catch (error) {
    console.error(error);
  } finally {
    console.timeEnd(pbf);
  }
};

const upload = async () => {
  console.time("upload-pmtiles");
  await $`aws-vault exec newearth -- aws s3 sync ./output s3://newearth-public/maps/`;
  console.timeEnd("upload-pmtiles");
};

const main = async () => {
  const tag = "geofabrik-region-download";
  try {
    console.time(tag);
    const promises = pbfs.map(pbfToPmtiles);
    await Promise.all(promises);
    await upload();
  } catch (error) {
    console.error(error);
  } finally {
    console.timeEnd(tag);
  }
};

main();
