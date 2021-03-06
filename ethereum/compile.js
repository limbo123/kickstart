const solc = require("solc");
const fs = require("fs-extra");
const path = require("path");

const buildPath = path.resolve(__dirname, "build");
fs.removeSync(buildPath);

const campaignPath = path.resolve(__dirname, "contracts", "Campaign.sol");
const source = fs.readFileSync(campaignPath, "utf8");

const compiledOutput = solc.compile(source, 1).contracts;

fs.ensureDirSync(buildPath);

for (const contract in compiledOutput) {
    fs.outputJsonSync(
        path.resolve(buildPath, `${contract.replace(":", "")}.json`),
        compiledOutput[contract]
      );
}
