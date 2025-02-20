import { $ } from "bun";

const logError = async (error: Error | unknown) => {
  await $`echo "${JSON.stringify(error)}" >> ./error/log.txt`;
  console.error(error);
};

export { logError };
