import { $ } from "bun";
import { existsSync } from "node:fs";

import type { LayerInput } from "./layer-input";
import { logError } from "./log-error";
import { makePath } from "./make-path";
import type { Path } from "glob";

const convertToMbtile = async (
  { name, collection, args, params }: LayerInput,
  input: string
) => {
  const filepath = `${await makePath(
    `${collection}/${name}`,
    "./output/mbtiles"
  )}.mbtiles`;
  if (!existsSync(filepath) || process.env.FORCE_MBTILES) {
    try {
      console.time(filepath);
      await $`tippecanoe ${args} -n ${name} -o ${filepath} ${params} ${input} --force`;
    } catch (error) {
      await logError(error);
    } finally {
      console.timeEnd(filepath);
    }
  }
  return filepath;
};

const convertShadedReliefToMbtile = async (
  { name, collection, args, params }: LayerInput,
  input: Path
) => {
  const filepath = `${await makePath(
    `${collection}/${name}/${input.name.replace(".geojson", "")}`,
    "./output/mbtiles"
  )}.mbtiles`;
  if (!existsSync(filepath) || process.env.FORCE_MBTILES) {
    try {
      console.time(filepath);
      return await $`tippecanoe ${args} -n ${name} -o ${filepath} ${params} ${input.fullpath()} --force`;
    } catch (error) {
      await logError(error);
    } finally {
      console.timeEnd(filepath);
    }
  }
  return filepath;
};

export { convertToMbtile, convertShadedReliefToMbtile };
