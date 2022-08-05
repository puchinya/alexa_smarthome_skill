import type { AWS } from '@serverless/typescript';

import smarthome from '@functions/smarthome';

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
    },
    lambdaHashingVersion: '20201221',
  },
  // import the function via paths
  functions: { smarthome },

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
