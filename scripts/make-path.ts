import { existsSync } from "node:fs";
import { $ } from "bun";

const makePath = async (input: string, targetDir: string) => {
  const path = input.split("/");
  const filename = `${path.pop()}`;
  let outputdir = targetDir;
  for (const segment of path) {
    outputdir = `${outputdir}/${segment}`;
    if (!existsSync(outputdir)) {
      await $`mkdir -p ${outputdir}`;
    }
  }
  return `${outputdir}/${filename}`;
};

export { makePath };
