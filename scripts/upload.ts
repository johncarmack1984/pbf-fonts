import { logError } from "./log-error";
import { $ } from "bun";

const upload = async () => {
  try {
    console.time("upload");
    await $`aws-vault exec newearth -- aws s3 sync ./output s3://newearth-public/maps/`;
  } catch (error) {
    logError(error);
  } finally {
    console.timeEnd("upload");
  }
};

export { upload };
