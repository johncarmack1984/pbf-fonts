// useful for Figma exports

import { dash } from "radash";
import { glob, type Path } from "glob";
import { logError } from "./log-error";
import { renameSync } from "node:fs";

const renameFile = (file: Path) => {
  const newName = dash(file.name.replace("=", "")).replace("-svg", ".svg");
  renameSync(
    `${file.parentPath}/${file.name}`,
    `${file.parentPath}/${newName}`
  );
  console.log(newName);
};

const renameFilesToDashCash = async () => {
  try {
    console.time("rename-files-to-dash-cash");
    const mg = await glob("./input/figma/fltsci-sprites/**/*.svg", {
      mark: true,
      ignore: ["/**/*.md"],
      stat: true,
      withFileTypes: true,
    });

    const files = mg
      .filter((m) => typeof m === "object")
      .sort((a, b) => Number(a.size) - Number(b.size));

    const promises = files.map(renameFile);

    await Promise.all(promises);
  } catch (error) {
    logError(error);
  } finally {
    console.timeEnd("upload-recursive");
  }
};

if (import.meta.main) {
  await renameFilesToDashCash();
  console.log("🎉Done");
}
