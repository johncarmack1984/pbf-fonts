import { generateSprite } from "sprite-one";

generateSprite(
  "output/sprite-one/sprites",
  ["input/mapbox-style/sprite_images"],
  [2]
).then(() => {});

generateSprite(
  "output/sprite-one/sprites-sdf",
  ["input/mapbox-style/sprite_images"],
  [2],
  true
).then(() => {});
