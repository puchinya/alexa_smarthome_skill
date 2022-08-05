import type { AWS } from '@serverless/typescript';

import proxy_lambda from '@functions/proxy_lambda';

const serverlessConfiguration: AWS = {
  service: 'proxy-lambda',
  frameworkVersion: '3',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true,
    },
  },
  plugins: ['serverless-webpack'],
  provider: {
    name: 'aws',
    stage: 'prod',
    region: 'us-west-2',
    profile: 'default',
    runtime: 'nodejs16.x',
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    },
    lambdaHashingVersion: '20201221',
  },
  // import the function via paths
  functions: { proxy_lambda },

  resources: {
    Resources: {
      lambdaRole: {
        Type: "AWS::IAM::Role",
        Properties: {
          RoleName: "proxyLambdaRole",
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: "Allow",
                Principal: {
                  Service: [
                    "lambda.amazonaws.com"
                  ]
                },
                Action: [
                  "sts:AssumeRole"
                ]
              }
            ]
          },
          ManagedPolicyArns: [
            "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
          ],
          Policies: [
            {
              PolicyName: "invoke-lambda",
              PolicyDocument: {
                Version: "2012-10-17",
                Statement: [
                  {
                    Effect: "Allow",
                    Action: [
                      "lambda:Invoke*"
                    ],
                    Resource: "*"
                  }
                ]
              }
            }
          ]
        }
      }
    }
  }
};

module.exports = serverlessConfiguration;
