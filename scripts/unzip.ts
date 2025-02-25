import { $ } from "bun";
import { logError } from "./log-error";
import { makePath } from "./make-path";
import { existsSync } from "node:fs";
import { glob } from "glob";

const unzip = async (
  zip: string,
  name: string,
  collection: string,
  outputRoot: string
) => {
  const outputDir = `${await makePath(`${collection}/${name}`, outputRoot)}`;
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

const unzipShadedRelief = async (
  zip: string,
  name: string,
  collection: string,
  outputRoot: string
) => {
  const outputDir = `${await makePath(`${collection}`, outputRoot)}`;
  const mg = await glob(`${outputDir}/**/*.shp`, {
    mark: true,
    stat: true,
    withFileTypes: true,
  });
  if (!mg.length) {
    try {
      console.time(outputDir);
      await $`unzip -o "${zip}" -d "${outputDir}"`;
    } catch (error) {
      await logError(error);
    } finally {
      console.timeEnd(outputDir);
    }
  }
  return outputDir;
};

export { unzip, unzipShadedRelief };
