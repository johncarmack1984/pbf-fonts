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
import { BucketAccessControl } from "aws-cdk-lib/aws-s3";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecr_assets from "aws-cdk-lib/aws-ecr-assets";

import "dotenv/config";
import { SecretValue } from "aws-cdk-lib";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { join } from "node:path";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";

declare const secret: ecs.Secret;

export class MartinTileserverStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "MartinTileserverVpc", {
      maxAzs: 3, // Default is all AZs in region
    });

    const cluster = new ecs.Cluster(this, "MartinTileserverCluster", { vpc });

    const service = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      "MartinTileservicePattern",
      {
        cluster,
        // taskImageOptions: {
        //   image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
        // },
        // minHealthyPercent: 100,
        // ipAddressType: elbv2.IpAddressType.DUAL_STACK,
      }
    );

    // const repository = new ecr.Repository(this, "MartinTileserverRepository", {
    //   repositoryName: "martin",
    //   removalPolicy: cdk.RemovalPolicy.DESTROY,
    // });

    // const image = ecs.ContainerImage.fromAsset(
    //   join(__dirname, "../../output/martin/")
    // );

    // // Create a Task Definition for the container to start
    // const taskDefinition = new ecs.Ec2TaskDefinition(
    //   this,
    //   "MartinTileserverTaskDef"
    // );

    // taskDefinition.addContainer("MartinTileserverContainer", {
    //   image,
    //   memoryLimitMiB: 512,
    //   // logging: ecs.LogDrivers.splunk({
    //   //   secretToken: secret,
    //   //   url: "my-splunk-url",
    //   // }),
    // });

    // // Create a load-balanced Fargate service and make it public
    // new ecs_patterns.ApplicationLoadBalancedFargateService(
    //   this,
    //   "MartinTileserverService",
    //   {
    //     cluster, // Required
    //     // cpu: 512, // Default is 256
    //     //     desiredCount: 6, // Default is 1
    //     taskImageOptions: { image },
    //     //     memoryLimitMiB: 2048, // Default is 512
    //     //     publicLoadBalancer: true, // Default is true
    //   }
    // );

    // nnginx cache for martin tileserver
    // const vpc = new ec2.Vpc(this, "MyApiVpc", {
    //   maxAzs: 1,
    // });

    // const cluster = new ecs.Cluster(this, "MyApiEcsCluster", { vpc });

    // const specificContainer = ecs.TaskDefinition.addContainer("Container", {
    //   image: ecs.ContainerImage.fromRegistry("/aws/aws-example-app"),
    //   memoryLimitMiB: 2048,
    // });

    // const lbfs = new ecs.FargateService(
    //   this,
    //   "MyApiLoadBalancedFargateService",
    //   {
    //     // cluster: cluster,
    //     // cpu: "256",
    //     // desiredCount: 1,
    //     // The tag for the docker image is set dynamically by our CI / CD pipeline
    //     // image: ecs.ContainerImage.fromDockerHub("nginx"),
    //     // memoryMiB: "512",
    //     // publicLoadBalancer: true,
    //     // containerPort: 80,
    //   }
    // );

    // const scaling = lbfs.service.autoScaleTaskCount({
    //   maxCapacity: 5,
    //   minCapacity: 1,
    // });

    // scaling.scaleOnCpuUtilization("MyApiCpuScaling", {
    //   targetUtilizationPercent: 10,
    // });
  }
}
// const asset = new ecr_assets.TarballImageAsset(this, "MartinDockerBuild", {
//   tarballFile: "martin.tar",
// });
/////// be sure you've run `./scripts/build-martin-tarball.sh`
/////// const asset = new ecr_assets.TarballImageAsset(this, "MartinDockerBuild", {
///////   tarballFile: "martin.tar",
/////// });
