const assert = require("assert");
const Web3 = require("web3");
const ganache = require("ganache-cli");
const Campaign = require("../ethereum/build/Campaign.json");
const campaignFactory = require("../ethereum/build/CampaignFactory.json")

const web3 = new Web3(ganache.provider());

let accounts;
let factory; 
let campaign;
let campaignAddress;

beforeEach(async() => {
    accounts = await web3.eth.getAccounts();
    factory = await new web3.eth.Contract(JSON.parse(campaignFactory.interface))
    .deploy({
        data: campaignFactory.bytecode
    })
    .send({
        from: accounts[0],
        gas: "1000000"
    })
    await factory.methods.createCampaign("100").send({
        from: accounts[0],
        gas: "1000000"
    })

    const addresses = await factory.methods.getDeployedCampaigns().call();
    campaignAddress = addresses[addresses.length - 1];
    campaign = await new web3.eth.Contract(JSON.parse(Campaign.interface), campaignAddress);

})

describe("Campaigns", () => {
    it("deploys correct", () => {
        assert.ok(factory.options.address);
        assert.ok(campaign.options.address);
    });

    it("save the caller as manager", async() => {
        assert.equal(accounts[0], await campaign.methods.manager().call());
    });

    it("allow users to contribute", async() => {
        await campaign.methods.contribute().send({
            from: accounts[0],
            value: "200"
        })

       const isApprover = await campaign.methods.approvers(accounts[0]).call();
       assert(isApprover);
    });
    it("requires a minimal contribution", async () => {
        let isContributed = false;
        try {
            await campaign.methods.contribute().send({
                from: accounts[0],
                value: "10"
            });
            isContributed = true;
        } catch (error) {
            assert(error);
        }
        assert.equal(false, isContributed);
    })

    it("allows a manager to create request", async() => {
        await campaign.methods.createRequest("test", "100", accounts[1]).send({
            from: accounts[0],
            gas: "1000000"
        })
        const request = await campaign.methods.requests(0).call();

        assert.equal("test", request.description);
    })

    it("works correctly", async() => {
        for(let i = 0; i < 3; i++) {
            await campaign.methods.contribute().send({
                from: accounts[i],
                value: "200"
            })
        }

        await campaign.methods.createRequest("test", "100", accounts[3]).send({
            from: accounts[0],
            gas: "1000000"
        });

        await campaign.methods.approveRequest(0).send({
            from: accounts[0]
        });

        await campaign.methods.approveRequest(0).send({
            from: accounts[1]
        });

        await campaign.methods.finalizeRequest(0).send({
            from: accounts[0]
        })

        const completedRequest = await campaign.methods.requests(0).call();

        assert(completedRequest.complete);
    })
})

