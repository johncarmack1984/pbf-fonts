import util from "node:util";
import { logError } from "./log-error";
import { $ } from "bun";
import { z } from "zod";

import { glob, type Path } from "glob";

import "dotenv/config";

const bucket = process.env.AWS_BUCKET;

const s3HeadObjectResponseSchema = z.object({
  AcceptRanges: z.string(),
  LastModified: z.string().transform((val) => new Date(val)),
  ContentLength: z.number(),
  ETag: z.string(),
  ContentType: z.string(),
  ServerSideEncryption: z.string(),
  Metadata: z.record(z.string(), z.any()),
});

type S3HeadObjectResponse = z.infer<typeof s3HeadObjectResponseSchema>;

const checkIfFileExistsInS3 = async (key: string) => {
  try {
    console.time(`${key}-check-s3`);
    const s3Response =
      await $`aws s3api head-object --bucket ${bucket} --key ${key}`.text();
    const s3ResponseJson: S3HeadObjectResponse = JSON.parse(s3Response);
    return s3ResponseJson;
  } catch (error) {
    return false;
  } finally {
    console.timeEnd(`${key}-check-s3`);
  }
};

const fileSizesAreDifferent = (
  s3ResponseJson: S3HeadObjectResponse,
  file: Path
) => s3ResponseJson.ContentLength !== file.size;

const decideIfShouldUpload = async (file: Path) => {
  const key = file.name;
  try {
    console.time(`${key}-check-if-upload`);
    const s3Response = await checkIfFileExistsInS3(key);
    if (!s3Response) {
      console.log(`⚠️ ${key} does not exist in S3, uploading...`);
      return true;
    }

    if (fileSizesAreDifferent(s3Response, file)) {
      console.log(
        `${key} size mismatch: ${s3Response.ContentLength} !== ${file.size}; reuploading...`
      );
      return true;
    }
    const s3Modified = new Date(s3Response.LastModified);
    const localModified = file.mtime;
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
    console.timeEnd(`${key}-check-if-upload`);
  }
};

const uploadFile = async (file: Path) => {
  const path = file.relativePosix();
  const key = file.name;
  const cmd = `aws s3 cp ${path} s3://${bucket}/${key}`;
  try {
    console.time(cmd);

    if (!(await decideIfShouldUpload(file))) {
      console.log(`😄 skipping ${key}`);
      return;
    }
    console.log(`⬆️ uploading ${key}`);
    const res = await $`aws s3 cp ${path} s3://${bucket}/${key}`;
    console.log(`✅ uploaded ${key}`);
    return res;
  } catch (error) {
    logError(error);
    throw error;
  } finally {
    console.timeEnd(cmd);
  }
};

const uploadAll = async () => {
  try {
    console.time("upload-recursive");
    const mg = await glob("./**/*.pmtiles", {
      mark: true,
      ignore: ["/**/*.md"],
      stat: true,
      withFileTypes: true,
    });

    const files = mg
      .filter((m) => typeof m === "object")
      .sort((a, b) => Number(a.size) - Number(b.size));

    const promises = files.map(uploadFile);

    await Promise.all(promises);
  } catch (error) {
    logError(error);
  } finally {
    console.timeEnd("upload-recursive");
  }
};

if (import.meta.main) {
  await uploadAll();
  console.log("🎉Done");
}

export { uploadAll as upload };
