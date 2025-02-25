import { $ } from "bun";
import { z } from "zod";
import { existsSync } from "node:fs";
import { logError } from "./log-error";
import { makePath } from "./make-path";
import { upload } from "./upload";

import "dotenv/config";
import { unzip } from "./unzip";
import { convertToGeojson } from "./convert-to-geojson";
import type { LayerInput } from "./layer-input";
import { convertToMbtile } from "./convert-to-mbtile";

const base: LayerInput[] = [
  // {
  //   name: "ne_10m_coastline",
  //   collection: "10m/physical",
  //   description: "Coastline",
  //   args: ["-zg"],
  //   params: [
  //     "--coalesce-densest-as-needed",
  //     "--extend-zooms-if-still-dropping",
  //   ],
  // },
  {
    name: "ne_10m_ocean",
    collection: "10m/physical",
    description: "Ocean",
    args: ["-zg"],
    params: [
      "--coalesce-densest-as-needed",
      "--extend-zooms-if-still-dropping",
    ],
  },
  // {
  //   name: "ne_10m_antarctic_ice_shelves_polys",
  //   collection: "10m/physical",
  //   description: "Antarctic Ice Shelves",
  //   args: ["-zg"],
  //   params: [
  //     "--coalesce-densest-as-needed",
  //     "--extend-zooms-if-still-dropping",
  //   ],
  // },
  // {
  //   name: "ne_10m_glaciated_areas",
  //   collection: "10m/physical",
  //   description: "Glaciated Areas",
  //   args: ["-zg"],
  //   params: [
  //     "--coalesce-densest-as-needed",
  //     "--extend-zooms-if-still-dropping",
  //   ],
  // },
];

const world: LayerInput[] = [
  {
    name: "ne_10m_admin_0_boundary_lines_land",
    collection: "10m/cultural",
    description: "Admin 0 Boundary Lines Land",
    args: ["-Z4", "-zg"],
    params: [
      "--extend-zooms-if-still-dropping",
      "--coalesce-densest-as-needed",
    ],
  },
  {
    name: "ne_10m_admin_0_countries",
    collection: "10m/cultural",
    description: "Admin 0 Countries",
    args: ["-z3", "-zg"],
    params: ["--coalesce-densest-as-needed"],
  },
  {
    name: "ne_10m_admin_1_states_provinces",
    collection: "10m/cultural",
    description: "Admin 1 States Provinces",
    args: ["-Z4", "-zg"],
    params: [
      "--coalesce-densest-as-needed",
      "--extend-zooms-if-still-dropping",
    ],
  },
  {
    name: "ne_10m_urban_areas",
    collection: "10m/cultural",
    description: "Urban Areas",
    args: ["-zg"],
    params: [
      "--coalesce-densest-as-needed",
      "--extend-zooms-if-still-dropping",
    ],
  },
];

const airports: LayerInput[] = [
  {
    name: "ne_10m_airports",
    collection: "10m/cultural",
    description: "Airports",
    args: ["-zg"],
    params: ["--extend-zooms-if-still-dropping"],
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

const downloadToMbtile = async ({
  name,
  collection,
  args,
  params,
  description,
}: LayerInput) => {
  const tiles: string[] = [];
  try {
    console.time(name);
    const zip = await download(`${collection}/${name}`);
    const shp = await unzip(zip, name, collection, "./output/ne");
    const geojson = await convertToGeojson(`${collection}/${name}`, shp);
    const mbtiles = await convertToMbtile(
      { name, collection, args, params, description },
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

const downloadAllToMbtile = async (input: LayerInput[]) => {
  if (input.length === 0) return [];
  const promises = input.map(downloadToMbtile);
  return (await Promise.all(promises)).flat();
};

const joinMbTiles = async (
  tiles: string[],
  outputName: string,
  description: string
) => {
  const output = `${await makePath(outputName, "./output/mbtiles")}.mbtiles`;
  if (!existsSync(output) || process.env.FORCE_TILE_JOIN) {
    try {
      console.time(output);
      if (tiles.length < 2) {
        await $`cp ${tiles[0]} ${output}`;
        return output;
      }
      await $`tile-join -o ${output} ${tiles} -A "Flight Science" --name "${outputName}" --description "${description}" --force`;
    } catch (error) {
      await logError(error);
    } finally {
      console.timeEnd(output);
    }
  }
  return output;
};

const convertToPmTile = async (
  input: string,
  outputName: string,
  description: string
) => {
  const output = `${await makePath(outputName, "./output/pmtiles")}.pmtiles`;
  if (!existsSync(output) || process.env.FORCE_PMTILES) {
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

const convertAllInputs = async ([name, description, inputs]: [
  name: string,
  description: string,
  inputs: LayerInput[]
]) => {
  console.time(name);
  if (inputs.length > 0) {
    const mbtiles = await downloadAllToMbtile(inputs);
    const outputName = await joinMbTiles(mbtiles, name, description);
    await convertToPmTile(outputName, name, description);
  }
  console.timeEnd(name);
};

const main = async () => {
  const inputs: [string, string, LayerInput[]][] = [
    ["base", "Coastline and land cover", base],
    // ["world", "Shapes of continents and countries", world],
    // ["airports", "Point data for every airport on OpenStreetMap", airports],
  ];
  try {
    const promises = inputs.map(convertAllInputs);
    await Promise.all(promises);
    if (process.env.UPLOAD) {
      await upload();
    }
  } catch (error) {
    await logError(error);
  } finally {
  }
};

main();
