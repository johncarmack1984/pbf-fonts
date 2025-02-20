// Takes one argument, the path to a file that exports an array of Input objects

import { $ } from "bun";
import { z } from "zod";
import { existsSync } from "node:fs";
import path from "node:path";

const world: Input[] = [
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
];

const airports: Input[] = [
  {
    name: "ne_10m_airports",
    args: ["-zg"],
    params: ["--drop-densest-as-needed", "--extend-zooms-if-still-dropping"],
  },
];

const naturalEarthInputSchema = z.object({
  name: z.string({ message: "Name: Expected a string" }),
  args: z.array(z.string({ message: "Args: Expected an array of strings" })),
  params: z.array(
    z.string({ message: "Params: Expected an array of strings" })
  ),
});

export type Input = z.infer<typeof naturalEarthInputSchema>;

const logError = async (error: Error | unknown) => {
  await $`echo "${JSON.stringify(error)}" >> ./error/log.txt`;
  console.error(error);
};

const download = async (name: string) => {
  const tag = `download-${name}`;
  const filepath = `./output/zip/${name}.zip`;
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
  const filepath = `./output/geojson/${name}.geojson`;
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
  const filepath = `./output/mbtiles/${name}.mbtiles`;
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

const convertAllToMbtile = async (input: Input[]) => {
  const tiles: string[] = [];
  if (input.length === 0) return tiles;
  for (const { name, args, params } of input) {
    try {
      console.time(name);
      const zip = await download(name);
      const shp = await unzip(zip, name, `./output/ne/${name}`, "shp");
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

const joinMbTiles = async (tiles: string[], outputName: string) => {
  const output = `./output/mbtiles/${outputName}.mbtiles`;
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

const convertToPmTile = async (input: string, outputName: string) => {
  const output = `./output/pmtiles/${outputName}.pmtiles`;
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

const convertAllInputs = async ([name, inputs]: [
  name: string,
  inputs: Input[]
]) => {
  console.time(name);
  const mbtiles = await convertAllToMbtile(inputs);
  const outputName = await joinMbTiles(mbtiles, name);
  const pmtiles = await convertToPmTile(outputName, name);
  console.timeEnd(name);
  return pmtiles;
};

const main = async () => {
  const inputs: [string, Input[]][] = [
    ["world", world],
    ["airports", airports],
  ];
  try {
    const promises = inputs.map(convertAllInputs);
    await Promise.all(promises);
  } catch (error) {
    await logError(error);
  } finally {
  }
};

main();
