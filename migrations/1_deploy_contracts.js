var StoreHash = artifacts.require("./certificate.sol");

module.exports = function(deployer) {
  deployer.deploy(StoreHash);
};
