const config = {
  ...require("@wrench/semantic-release-ws-preset-nodejs/default"),
};
config.packages = {
  ...config.packages,
};
config.workspace = {
  ...config.workspace,
};
module.exports = config;
