// import util from "node:util";
import { logError } from "./log-error";
import { $ } from "bun";
import { z } from "zod";
import { existsSync, readFileSync } from "node:fs";

import { glob, type Path } from "glob";

const outputDir = "./output/martin/tiles";

const checkIfFileExists = async (key: string) => {
  const outputPath = `${outputDir}/${key}`;
  try {
    console.time(`${key}-check-s3`);
    const files = (
      await glob(outputPath, {
        mark: true,
        ignore: ["infra/**/*", "/**/*.md"],
        stat: true,
        withFileTypes: true,
      })
    ).filter((m) => typeof m === "object");
    return files[0];
  } catch (error) {
    return false;
  } finally {
    console.timeEnd(`${key}-check-s3`);
  }
};

const fileSizesAreDifferent = (dest: Path, file: Path) =>
  dest.size !== file.size;

const decideIfShouldCopy = async (file: Path) => {
  const key = file.name;
  try {
    console.time(`${key}-check-if-copy`);
    const outputFile = await checkIfFileExists(key);
    if (!outputFile) {
      console.log(`⚠️ ${key} does not exist, copying...`);
      return true;
    }

    if (fileSizesAreDifferent(outputFile, file)) {
      console.log(
        `${key} size mismatch: ${outputFile.size} !== ${file.size}; recopying...`
      );
      return true;
    }
    const s3Modified = outputFile.mtime;
    const localModified = file.mtime;
    if (!s3Modified) throw new Error(`${key} has no s3 modified date`);
    if (!localModified) throw new Error(`${key} has no local modified date`);
    if (localModified.getTime() > s3Modified.getTime()) {
      console.log(`${key} local updated recently, updating s3`);
      return true;
    }
    console.log(`✅ ${key} no changes, skipping`);
    return false;
  } catch (error) {
    logError(error);
    throw error;
  } finally {
    console.timeEnd(`${key}-check-if-copy`);
  }
};

const copyFile = async (file: Path) => {
  const path = file.relativePosix();
  const key = file.name;
  const cmd = `cp ${path} ./output/martin/${key}`;
  try {
    console.time(cmd);

    if (!(await decideIfShouldCopy(file))) {
      console.log(`😄 skipping ${key}`);
      return;
    }
    console.log(`⬆️ copying ${key}`);
    const res = await $`cp ${path} ${outputDir}/${key}`;
    console.log(`✅ copyed ${key}`);
    return res;
  } catch (error) {
    logError(error);
    throw error;
  } finally {
    console.timeEnd(cmd);
  }
};

const copyAll = async () => {
  try {
    console.time("copy-recursive");
    const mg = await glob("./**/*.pmtiles", {
      mark: true,
      ignore: ["infra/**/*", "/**/*.md"],
      stat: true,
      withFileTypes: true,
    });

    const files = mg
      .filter((m) => typeof m === "object")
      .sort((a, b) => Number(a.size) - Number(b.size));

    const promises = files.map(copyFile);

    await Promise.all(promises);
  } catch (error) {
    logError(error);
  } finally {
    console.timeEnd("copy-recursive");
  }
};

if (import.meta.main) {
  await copyAll();
  console.log("🎉Done");
}

export { copyAll as copy };
