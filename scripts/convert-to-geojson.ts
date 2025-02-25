import { $ } from "bun";
import { existsSync } from "node:fs";
import { logError } from "./log-error";
import { makePath } from "./make-path";
import type { LayerInput } from "./layer-input";
import type { Path } from "glob";

const convertToGeojson = async (name: string, input: string) => {
  const filepath = `${await makePath(name, "./output/geojson")}.geojson`;
  if (!existsSync(filepath) || process.env.FORCE_GEOJSON) {
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

const convertShadedReliefToGeojson = async ({ name, parentPath }: Path) => {
  const segments = parentPath.split("/");
  const dataset = segments.pop();
  const collection = segments.pop();
  const dataSource = segments.pop();
  const fileName = name.split(".")[0];
  const filepath = `${await makePath(
    `${dataSource}/${collection}/${dataset}/${fileName}`,
    "./output/geojson"
  )}.geojson`;
  if (!existsSync(filepath) || process.env.FORCE_GEOJSON) {
    try {
      console.time(filepath);
      await $`ogr2ogr -f GeoJSON ${filepath} ${parentPath}/${fileName}.shp`;
    } catch (error) {
      await logError(error);
    } finally {
      console.timeEnd(filepath);
    }
  }
  return filepath;
};

export { convertToGeojson, convertShadedReliefToGeojson };
