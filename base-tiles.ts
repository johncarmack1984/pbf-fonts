import { $ } from "bun";

import { existsSync } from "node:fs";

type Input = {
  name: string;
  args: string[];
  params: string[];
};

const shps: Input[] = [
  {
    name: "ne_10m_admin_0_boundary_lines_land",
    args: ["-Z4", "-zg"],
    params: [
      "--extend-zooms-if-still-dropping",
      "--coalesce-densest-as-needed",
    ],
  },
  {
    name: "ne_10m_admin_0_countries",
    args: ["-z3", "-zg"],
    params: ["--coalesce-densest-as-needed"],
  },
  {
    name: "ne_10m_admin_1_states_provinces",
    args: ["-Z4", "-zg"],
    params: [
      "--coalesce-densest-as-needed",
      "--extend-zooms-if-still-dropping",
    ],
  },
  {
    name: "ne_10m_airports",
    args: ["-zg"],
    params: ["--drop-densest-as-needed", "--extend-zooms-if-still-dropping"],
  },
];

const logError = async (error: Error | unknown) => {
  await $`echo "${JSON.stringify(error)}" >> ./error/log.txt`;
  console.error(error);
};

const download = async (name: string) => {
  const tag = `download-${name}`;
  const filepath = `./zip/${name}.zip`;
  if (!existsSync(filepath)) {
    console.time(tag);
    await $`echo "Downloading ${filepath}..."`;
    try {
      await $`curl "https://naciscdn.org/naturalearth/10m/cultural/${name}.zip" -o ${filepath}`;
      await $`echo "OK"`;
    } catch (error) {
      await logError(error);
    } finally {
      console.timeEnd(tag);
    }
  }
  return filepath;
};

const unzip = async (
  zip: string,
  name: string,
  outputDir: string,
  outputExt: string
) => {
  const filepath = `${outputDir}/${name}.${outputExt}`;
  if (!existsSync(filepath)) {
    try {
      console.time(`unzip-${name}`);
      await $`unzip -o "${zip}" -d "${outputDir}"`;
    } catch (error) {
      await logError(error);
    } finally {
      console.timeEnd(`unzip-${name}`);
    }
  }
  return filepath;
};

const convertToGeojson = async (name: string, input: string) => {
  const filepath = `./geojson/${name}.geojson`;
  if (!existsSync(filepath)) {
    try {
      console.time(`convert-${name}`);
      await $`ogr2ogr -f GeoJSON ${filepath} ${input}`;
    } catch (error) {
      await logError(error);
    } finally {
      console.timeEnd(`convert-${name}`);
    }
  }
  return filepath;
};

const convertToMbtile = async (
  { name, args, params }: Input,
  input: string
) => {
  const filepath = `./mbtiles/${name}.mbtiles`;
  if (!existsSync(filepath)) {
    try {
      console.time(`convert-${name}`);
      await $`tippecanoe ${args} -o ${filepath} ${params} ${input} --force`;
    } catch (error) {
      await logError(error);
    } finally {
      console.timeEnd(`convert-${name}`);
    }
  }
  return filepath;
};

const convertAllToMbtile = async () => {
  const tiles: string[] = [];
  for (const { name, args, params } of shps) {
    try {
      console.time(name);
      const zip = await download(name);
      const shp = await unzip(zip, name, `./ne/${name}`, "shp");
      const geojson = await convertToGeojson(name, shp);
      const mbtiles = await convertToMbtile({ name, args, params }, geojson);
      tiles.push(mbtiles);
    } catch (error) {
      await logError(error);
    } finally {
      console.timeEnd(name);
    }
  }
  return tiles;
};

const joinMbTiles = async (tiles: string[]) => {
  const output = "./mbtiles/world.mbtiles";
  if (!existsSync(output)) {
    try {
      console.time(output);
      await $`tile-join -o ${output} ${tiles} --force`;
    } catch (error) {
      await logError(error);
    } finally {
      console.timeEnd(output);
    }
  }
  return output;
};

const convertToPmTile = async (input: string) => {
  const output = "./pmtiles/world.pmtiles";
  if (!existsSync(output)) {
    try {
      console.time(output);
      await $`pmtiles convert ${input} ${output}`;
    } catch (error) {
      await logError(error);
    } finally {
      console.timeEnd(output);
    }
  }
  return output;
};

const main = async () => {
  const tag = "create-base-tiles";
  try {
    console.time(tag);
    const mbtiles = await convertAllToMbtile();
    const world = await joinMbTiles(mbtiles);
    const pmtiles = await convertToPmTile(world);
    await $`echo "Done! ${pmtiles}"`;
  } catch (error) {
    await logError(error);
  } finally {
    console.timeEnd(tag);
  }
};

main();
