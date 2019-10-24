/** @type {WsConfiguration} */
const config = {
  ...require("@wrench/semantic-release-ws-preset-nodejs/default"),
};

config.workspace = {
  ...config.workspace,
  reduceReleaseType: "patch",
};

config.packages = {
  ...config.packages,
};

module.exports = config;
