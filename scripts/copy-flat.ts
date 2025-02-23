import { glob, type Path } from "glob";
import { cpSync } from "node:fs";

const inputPath = process.argv[2];
const outputPath = process.argv[3];

interface CopyPath {
  input: Path;
  outputDir: string;
}

const copyFile = ({
  input: { parentPath, sep, name },
  outputDir,
}: CopyPath) => {
  const inputFile = `${parentPath}${sep}${name}`;
  const outputFile = `${outputDir}${sep}${name}`;
  cpSync(inputFile, outputFile, {
    dereference: true,
    errorOnExist: false,
    force: true,
    preserveTimestamps: true,
  });
};

const copyFlat = async (inputDir: string, outputDir: string) => {
  console.time("copy-flat");
  const mg = await glob(`${inputDir}/**/*.*`, {
    mark: true,
    ignore: ["/**/*.md", ".DS_Store"],
    stat: true,
    withFileTypes: true,
  });

  mg.filter((m) => typeof m === "object")
    .sort((a, b) => Number(a.size) - Number(b.size))
    .map((input) => copyFile({ input, outputDir }));

  console.timeEnd("copy-flat");
};

if (import.meta.main) {
  await copyFlat(inputPath, outputPath);
}
