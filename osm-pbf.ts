import { $ } from "bun";

import { existsSync } from "node:fs";

const pbfs = [
  "africa-latest",
  "antarctica-latest",
  "asia-latest",
  "australia-oceania-latest",
  "central-america-latest",
  "europe-latest",
  "north-america-latest",
  "south-america-latest",
];

const main = async () => {
  for (const pbf of pbfs) {
    const filename = `${pbf}.osm.pbf`;
    const filepath = `./osm/${filename}`;
    if (!existsSync(filepath)) {
      await $`echo "Downloading ${filepath}..."`;
      try {
        await $`curl "https://download.geofabrik.de/${filename}" --output ${filepath}`;
        await $`echo "OK"`;
      } catch (error) {
        await $`echo "ERROR"`;
        console.error(error);
      }
    }
  }
  await $`echo "Done updating PBFs!\n"`;
};

main();
