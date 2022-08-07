import type { AWS } from '@serverless/typescript';

import smarthome from '@functions/smarthome';
import smarthome_report from '@functions/smarthome_report';
import smarthome_add_report from '@functions/smarthome_add_report';
import smarthome_delete_report from "@functions/smarthome_delete_report";

const serverlessConfiguration: AWS = {
  service: 'alexa-smarthome-skill',
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
    region: 'ap-northeast-1',
    profile: 'default',
    runtime: 'nodejs16.x',
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      LWA_CLIENT_ID: "dummy",
      LWA_CLIENT_SECRET: "dummy"
    },
    lambdaHashingVersion: '20201221',
  },
  // import the function via paths
  functions: { smarthome, smarthome_report, smarthome_add_report, smarthome_delete_report },

  resources: {
    Resources: {
      alexaUserInfoTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          TableName: "alexa_lwa_token_table",
          AttributeDefinitions: [
            {
              AttributeName: "uid",
              AttributeType: "S"
            },
          ],
          KeySchema: [
            {
              AttributeName: "uid",
              KeyType: "HASH"
            }
          ],
          BillingMode: "PAY_PER_REQUEST"
        }
      },


      alexaDeviceStatusTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          TableName: "alexa_device_status_table",
          AttributeDefinitions: [
            {
              AttributeName: "uid",
              AttributeType: "S"
            },
            {
              AttributeName: "device_id",
              AttributeType: "S"
            }
          ],
          KeySchema: [
            {
              AttributeName: "uid",
              KeyType: "HASH"
            },
            {
              AttributeName: "device_id",
              KeyType: "RANGE"
            }
          ],
          BillingMode: "PAY_PER_REQUEST"
        }
      },

      lambdaRole: {
        Type: "AWS::IAM::Role",
        Properties: {
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
                      "dynamodb:PutItem",
                      "dynamodb:GetItem",
                      "dynamodb:UpdateItem",
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
