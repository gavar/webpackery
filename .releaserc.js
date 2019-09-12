const config = {
  ...require("@wrench/semantic-release-ws-preset-nodejs/default"),
};
config.workspace = {
  ...config.workspace,
};
config.packages = {
  ...config.packages,
};
module.exports = config;
