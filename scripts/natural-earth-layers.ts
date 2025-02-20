import { $ } from "bun";
import { z } from "zod";
import { existsSync } from "node:fs";
import { logError } from "./log-error";
import { makePath } from "./make-path";
import { upload } from "./upload";

const naturalEarthInputSchema = z.object({
  name: z.string({ message: "Name: Expected a string" }),
  collection: z.string({ message: "Collection: Expected a string" }),
  args: z.array(z.string({ message: "Args: Expected an array of strings" })),
  params: z.array(
    z.string({ message: "Params: Expected an array of strings" })
  ),
});

export type Input = z.infer<typeof naturalEarthInputSchema>;

const base: Input[] = [
  {
    name: "ne_10m_coastline",
    collection: "10m/physical",
    args: ["-zg"],
    params: [
      "--coalesce-densest-as-needed",
      "--extend-zooms-if-still-dropping",
    ],
  },
  {
    name: "ne_10m_ocean",
    collection: "10m/physical",
    args: ["-zg"],
    params: [
      "--coalesce-densest-as-needed",
      "--extend-zooms-if-still-dropping",
    ],
  },
  {
    name: "ne_10m_antarctic_ice_shelves_polys",
    collection: "10m/physical",
    args: ["-zg"],
    params: [
      "--coalesce-densest-as-needed",
      "--extend-zooms-if-still-dropping",
    ],
  },
  {
    name: "ne_10m_glaciated_areas",
    collection: "10m/physical",
    args: ["-zg"],
    params: [
      "--coalesce-densest-as-needed",
      "--extend-zooms-if-still-dropping",
    ],
  },
];

const world: Input[] = [
  {
    name: "ne_10m_admin_0_boundary_lines_land",
    collection: "10m/cultural",
    args: ["-Z4", "-zg"],
    params: [
      "--extend-zooms-if-still-dropping",
      "--coalesce-densest-as-needed",
    ],
  },
  {
    name: "ne_10m_admin_0_countries",
    collection: "10m/cultural",
    args: ["-z3", "-zg"],
    params: ["--coalesce-densest-as-needed"],
  },
  {
    name: "ne_10m_admin_1_states_provinces",
    collection: "10m/cultural",
    args: ["-Z4", "-zg"],
    params: [
      "--coalesce-densest-as-needed",
      "--extend-zooms-if-still-dropping",
    ],
  },
  {
    name: "ne_10m_urban_areas",
    collection: "10m/cultural",
    args: ["-zg"],
    params: [
      "--coalesce-densest-as-needed",
      "--extend-zooms-if-still-dropping",
    ],
  },
];

const airports: Input[] = [
  {
    name: "ne_10m_airports",
    collection: "10m/cultural",
    args: ["-zg"],
    params: ["--drop-densest-as-needed", "--extend-zooms-if-still-dropping"],
  },
];

const download = async (name: string) => {
  const filepath = `${await makePath(name, "./output/zip")}.zip`;
  if (!existsSync(filepath)) {
    try {
      console.time(filepath);
      await $`curl "https://naciscdn.org/naturalearth/${name}.zip" -o ${filepath}`;
    } catch (error) {
      await logError(error);
    } finally {
      console.timeEnd(filepath);
    }
  }
  return filepath;
};

const unzip = async (zip: string, name: string, collection: string) => {
  const outputDir = `${await makePath(`${collection}/${name}`, "./output/ne")}`;
  const filepath = `${outputDir}/${name}.shp`;
  if (!existsSync(filepath)) {
    try {
      console.time(filepath);
      await $`unzip -o "${zip}" -d "${outputDir}"`;
    } catch (error) {
      await logError(error);
    } finally {
      console.timeEnd(filepath);
    }
  }
  return filepath;
};

const convertToGeojson = async (name: string, input: string) => {
  const filepath = `${await makePath(name, "./output/geojson")}.geojson`;
  if (!existsSync(filepath)) {
    try {
      console.time(filepath);
      await $`ogr2ogr -f GeoJSON ${filepath} ${input}`;
    } catch (error) {
      await logError(error);
    } finally {
      console.timeEnd(filepath);
    }
  }
  return filepath;
};

const convertToMbtile = async (
  { name, collection, args, params }: Input,
  input: string
) => {
  const filepath = `${await makePath(
    `${collection}/${name}`,
    "./output/mbtiles"
  )}.mbtiles`;
  if (!existsSync(filepath)) {
    try {
      console.time(filepath);
      await $`tippecanoe ${args} -o ${filepath} ${params} ${input} --force`;
    } catch (error) {
      await logError(error);
    } finally {
      console.timeEnd(filepath);
    }
  }
  return filepath;
};

const downloadToMbtile = async ({ name, collection, args, params }: Input) => {
  const tiles: string[] = [];
  try {
    console.time(name);
    const zip = await download(`${collection}/${name}`);
    const shp = await unzip(zip, name, collection);
    const geojson = await convertToGeojson(`${collection}/${name}`, shp);
    const mbtiles = await convertToMbtile(
      { name, collection, args, params },
      geojson
    );
    tiles.push(mbtiles);
  } catch (error) {
    await logError(error);
  } finally {
    console.timeEnd(name);
  }
  return tiles;
};

const downloadAllToMbtile = async (input: Input[]) => {
  if (input.length === 0) return [];
  const promises = input.map(downloadToMbtile);
  return (await Promise.all(promises)).flat();
};

const joinMbTiles = async (tiles: string[], outputName: string) => {
  const output = `${await makePath(outputName, "./output/mbtiles")}.mbtiles`;
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
  const output = `${await makePath(outputName, "./output/pmtiles")}.pmtiles`;
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
  if (inputs.length > 0) {
    const mbtiles = await downloadAllToMbtile(inputs);
    const outputName = await joinMbTiles(mbtiles, name);
    await convertToPmTile(outputName, name);
  }
  console.timeEnd(name);
};

const main = async () => {
  const inputs: [string, Input[]][] = [
    ["base", base],
    ["world", world],
    ["airports", airports],
  ];
  try {
    const promises = inputs.map(convertAllInputs);
    await Promise.all(promises);
    await upload();
  } catch (error) {
    await logError(error);
  } finally {
  }
};

main();
