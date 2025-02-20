import { $ } from "bun";
import { logError } from "./log-error";
import { makePath } from "./make-path";
import { existsSync } from "node:fs";

const downloads = ["water-polygons-split-4326"];

const download = async (name: string) => {
  const filepath = `${await makePath(`osm/${name}`, "./output/zip")}.zip`;
  if (!existsSync(filepath)) {
    try {
      console.time(filepath);
      await $`curl --proto https://osmdata.openstreetmap.de/download/${name}.zip --output ${filepath}`;
    } catch (error) {
      logError(error);
    } finally {
      console.timeEnd(filepath);
    }
  }
  return filepath;
};

const unzip = async (name: string, input: string) => {
  const filepath = `${await makePath(name, `./output/osm/${name}`)}`;
  console.time(filepath);
  if (!existsSync(filepath)) {
    try {
      await $`unzip -o -j ${input} -d "./output/osm/${name}"`;
    } catch (error) {
      logError(error);
    } finally {
    }
  }
  console.timeEnd(filepath);
  return filepath;
};

const run = async (name: string) => {
  console.time(name);
  const filepath = await download(name);
  await unzip(name, filepath);
  console.timeEnd(name);
};

const main = async () => {
  try {
    console.time("osm");
    const promises = downloads.map(run);
    await Promise.all(promises);
  } catch (error) {
    logError(error);
  } finally {
    console.timeEnd("osm");
  }
};

main();
