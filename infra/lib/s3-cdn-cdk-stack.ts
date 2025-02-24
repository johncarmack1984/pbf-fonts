import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deployment from "aws-cdk-lib/aws-s3-deployment";
import {
  Distribution,
  OriginRequestPolicy,
  AllowedMethods,
  CachedMethods,
  CachePolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import type { Construct } from "constructs";

export class S3CdnCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);
    const desktopPublicCorsRule: s3.CorsRule = {
      allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
      allowedOrigins: ["*"],
      allowedHeaders: ["*"],
      maxAge: 300,
    };
    const desktopPublicBucket = new s3.Bucket(this, "DesktopPublicBucket", {
      bucketName: "newearth-public",
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      accessControl: s3.BucketAccessControl.PRIVATE,
      cors: [desktopPublicCorsRule],
      versioned: true,
      objectLockEnabled: true,
    });
    new s3deployment.BucketDeployment(this, "DesktopPublicBucketDeployment", {
      sources: [],
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
