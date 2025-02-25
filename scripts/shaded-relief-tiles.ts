import { $ } from "bun";
import { logError } from "./log-error";
import { existsSync } from "node:fs";
import { glob } from "glob";
import { makePath } from "./make-path";
import "dotenv/config";
import { unzipShadedRelief } from "./unzip";
import {
  convertShadedReliefToGeojson,
  convertToGeojson,
} from "./convert-to-geojson";
import type { LayerInput } from "./layer-input";
import {
  convertShadedReliefToMbtile,
  convertToMbtile,
} from "./convert-to-mbtile";

const layerInputs: [string, string, LayerInput[]][] = [
  [
    "base",
    "Coastlines and Land Cover",
    [
      {
        collection: "ne-draft",
        name: "World-Base-Map-Shapefiles",
        description: "World Base Map",
        args: [],
        params: [],
        include: [
          "Bounding-Box.shp",
          "Ocean.shp",
          "Small-Islands.shp",
          "Coast.shp",
          "Land.shp",
        ],
      },
    ],
  ],
];

const downloadShapefiles = async ({
  collection,
  name,
}: Pick<LayerInput, "collection" | "name">) => {
  const output = `${await makePath(
    `${collection}/${name}`,
    "output/zip/shaded-relief"
  )}.zip`;
  if (!existsSync(output) || process.env.FORCE_DOWNLOAD) {
    try {
      console.time(output);
      await $`curl https://www.shadedrelief.com/${collection}/${name}.zip -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:135.0) Gecko/20100101 Firefox/135.0" --output ${output}`;
    } catch (error) {
      console.error(error);
    } finally {
      console.timeEnd(output);
    }
  }
  return output;
};

const processLayerInput = async ({
  collection,
  name,
  args,
  params,
  include,
  description,
}: LayerInput) => {
  const zipPath = await downloadShapefiles({ collection, name });
  const subLayerShapefiles = await unzipShadedRelief(
    zipPath,
    name,
    collection,
    "./output/shaded-relief"
  ).then(
    async (shapeFilesPath) =>
      await glob(`${shapeFilesPath}/**/*.shp`, {
        mark: true,
        stat: true,
        withFileTypes: true,
      }).then((res) =>
        res
          .filter((m) => typeof m === "object")
          .filter((m) => include?.includes(m.name))
          .sort((a, b) => Number(a.size) - Number(b.size))
      )
  );

  const subLayerGeojsons = await Promise.all(
    subLayerShapefiles.map(convertShadedReliefToGeojson)
  ).then(
    async () =>
      await glob(`./output/geojson/shaded-relief/${collection}/**/*.geojson`, {
        mark: true,
        stat: true,
        withFileTypes: true,
      }).then((res) =>
        res
          .filter((m) => typeof m === "object")
          .sort((a, b) => Number(a.size) - Number(b.size))
      )
  );

  const subLayerMbtiles = await Promise.all(
    subLayerGeojsons.map((geojson) =>
      convertShadedReliefToMbtile(
        { name, collection, args, params, description },
        geojson
      )
    )
  );
  console.log(subLayerMbtiles);
};

const processLayerInputs = async ([name, description, inputs]: [
  string,
  string,
  LayerInput[]
]) => {
  return await Promise.all(inputs.map(processLayerInput));
};

if (import.meta.main) {
  console.time("shaded-relief-tiles");
  try {
    const mbtiles = await Promise.all(layerInputs.map(processLayerInputs));
  } catch (error) {
    logError(error);
  } finally {
    console.timeEnd("shaded-relief-tiles");
  }
}
