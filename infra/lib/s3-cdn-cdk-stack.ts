import * as cdk from "aws-cdk-lib";
import {
  Bucket,
  BlockPublicAccess,
  HttpMethods,
  type CorsRule,
} from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import {
  Distribution,
  OriginRequestPolicy,
  AllowedMethods,
  CachedMethods,
  CachePolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import type { Construct } from "constructs";
import { BucketAccessControl } from "aws-cdk-lib/aws-s3";
import { join } from "node:path";

import "dotenv/config";

export class S3CdnCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // Desktop Public Assets (map sprites, etc.) & CloudFront CDN
    const desktopPublicCorsRule: CorsRule = {
      allowedMethods: [HttpMethods.GET, HttpMethods.HEAD],
      allowedOrigins: ["*"],
      allowedHeaders: ["*"],
      maxAge: 300,
    };
    const desktopPublicBucket = new Bucket(this, "DesktopPublicBucket", {
      bucketName: "newearth-public",
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      accessControl: BucketAccessControl.PRIVATE,
      cors: [desktopPublicCorsRule],
      versioned: true,
      objectLockEnabled: true,
    });
    new BucketDeployment(this, "DesktopPublicBucketDeployment", {
      sources: [Source.asset(join(__dirname, "../../output/sprite"))],
      destinationBucket: desktopPublicBucket,
    });
    new Distribution(this, "DesktopPublicDistribution", {
      defaultBehavior: {
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        origin: S3BucketOrigin.withOriginAccessControl(desktopPublicBucket),
        cachedMethods: CachedMethods.CACHE_GET_HEAD,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        compress: true,
        originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
      },
    });
  }
}
