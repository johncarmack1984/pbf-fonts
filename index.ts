import { $ } from "bun";

import { existsSync } from "node:fs";

const fonts = [
  "IBM Plex Mono Bold Italic",
  "IBM Plex Mono Bold",
  "IBM Plex Mono ExtraLight Italic",
  "IBM Plex Mono ExtraLight",
  "IBM Plex Mono Italic",
  "IBM Plex Mono Light Italic",
  "IBM Plex Mono Light",
  "IBM Plex Mono Medium Italic",
  "IBM Plex Mono Medium",
  "IBM Plex Mono Regular",
  "IBM Plex Mono SemiBold Italic",
  "IBM Plex Mono SemiBold",
  "IBM Plex Mono Thin Italic",
  "IBM Plex Mono Thin",
  "IBM Plex Sans Bold Italic",
  "IBM Plex Sans Bold",
  "IBM Plex Sans ExtraLight Italic",
  "IBM Plex Sans ExtraLight",
  "IBM Plex Sans Italic",
  "IBM Plex Sans Light Italic",
  "IBM Plex Sans Light",
  "IBM Plex Sans Medium Italic",
  "IBM Plex Sans Medium",
  "IBM Plex Sans Regular",
  "IBM Plex Sans SemiBold Italic",
  "IBM Plex Sans SemiBold",
  "IBM Plex Sans Thin Italic",
  "IBM Plex Sans Thin",
];

const main = async () => {
  const username = process.env.FLTSCI_USERNAME;
  const accessToken = process.env.FLTSCI_FONT_ACCESS_TOKEN;
  for (const font of fonts) {
    const dir = `./fonts/${font}`;
    if (!existsSync(dir)) {
      await $`mkdir -p ${dir}`;
    }
    const fontId = encodeURI(font);
    let start = 0;
    let end = 255;
    while (start <= 65280) {
      const range = `${start}-${end}`;
      const filename = `${range}.pbf`;
      const filepath = `${dir}/${filename}`;
      if (!existsSync(filepath)) {
        await $`printf "Downloading ${filepath}..."`;
        try {
          await $`curl -s "https://api.mapbox.com/fonts/v1/${username}/${fontId}/${filename}?access_token=${accessToken}" --output ${filepath}`;
          await $`printf "✅\n"`;
        } catch (error) {
          await $`printf "❌\n"`;
          console.error(error);
        }
      }
      start = end + 1;
      end += 256;
    }
  }
  await $`printf "Done\n"`;
};

main();
