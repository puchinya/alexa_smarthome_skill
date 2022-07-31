import type { AWS } from '@serverless/typescript';

import smarthome from '@functions/smarthome';

const serverlessConfiguration: AWS = {
  service: 'alexa-smarthome-skill',
  frameworkVersion: '2',
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
    runtime: 'nodejs14.x',
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    },
    lambdaHashingVersion: '20201221',
  },
  // import the function via paths
  functions: { smarthome },
};

module.exports = serverlessConfiguration;
