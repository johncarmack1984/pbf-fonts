import type { Input } from "../scripts/base-tiles";

const airports: Input[] = [
  {
    name: "ne_10m_airports",
    args: ["-zg"],
    params: ["--drop-densest-as-needed", "--extend-zooms-if-still-dropping"],
  },
];

export default airports;
