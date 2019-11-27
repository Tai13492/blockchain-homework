const Web3 = require("web3");
const Tx = require("ethereumjs-tx").Transaction;
const crypto = require("crypto");
const fs = require("mz/fs");

const filename = "p2.js";
const { WEB3_PROVIDER, HASH_SECRET, PRIVATE_KEY } = require("./config");

const MY_ACCOUNT_ADDRESS = "0xaC416D75753188F45d0E8F9E0EEB1b11B4620012";
const MY_STUDENT_ID = "t08902205";
const DESTINATION_ADDRESS = "0xC820cBdc60c879cB73Cdd895e7e89E796f6C6C16";

const web3 = new Web3(new Web3.providers.HttpProvider(WEB3_PROVIDER));
const {
  eth: ETH,
  utils: { toHex, toWei }
} = web3;

const promiseWrapper = promise =>
  promise
    .then(data => {
      return [null, data];
    })
    .catch(error => {
      console.error("error");
      return [error, null];
    });

async function hashSolutionFile() {
  console.log("retrieving solution file...");
  const [error, response] = await promiseWrapper(fs.readFile(filename, "utf8"));
  if (error) throw new Error(error);
  console.log(response);
  console.log("hashing solution file...");
  const hex = crypto
    .createHmac("sha256", HASH_SECRET)
    .update(response)
    .digest("hex");
  console.log(hex);
  return hex;
}

function generateABI(studentID, hex) {
  return web3.eth.abi.encodeFunctionCall(
    {
      constant: false,
      inputs: [
        {
          internalType: "string",
          name: "ID",
          type: "string"
        },
        {
          internalType: "string",
          name: "HashedHex",
          type: "string"
        }
      ],
      name: "Problem2",
      outputs: [],
      payable: true,
      stateMutability: "payable",
      type: "function"
    },
    [studentID, hex]
  );
}

async function getTransactionCount() {
  console.log("getting nonce...");
  const [error, count] = await promiseWrapper(
    ETH.getTransactionCount(MY_ACCOUNT_ADDRESS)
  );
  if (error) throw new Error(error);
  console.log(`nonce: ${count}`);
  return count;
}

async function sendSignedTransaction(rawTx) {
  console.log("sending transaction...");
  const [error, receipt] = await promiseWrapper(
    ETH.sendSignedTransaction(rawTx)
  );
  if (error) throw new Error(error);
  console.log(receipt);
  return receipt;
}

async function main() {
  // Create parameters of Q2
  const hex = await hashSolutionFile();
  const abi = generateABI(MY_STUDENT_ID, hex);
  // Get nonce (necessary params to send a transaction)
  const nonce = await getTransactionCount();

  // Create a transaction object
  const txObject = {
    nonce: toHex(nonce),
    to: DESTINATION_ADDRESS,
    value: toHex(toWei("3", "gwei")),
    gasLimit: toHex(3 * Math.pow(10, 6)),
    gasPrice: toHex(toWei("5", "gwei")),
    data: abi
  };
  // Sign a transaction object with our credentials
  const private_key = Buffer.from(PRIVATE_KEY, "hex");
  const tx = new Tx(txObject, { chain: "ropsten" });
  tx.sign(private_key);
  let serializedTx = tx.serialize();
  serializedTx = "0x" + serializedTx.toString("hex");

  // Send the transaction
  await sendSignedTransaction(serializedTx);
  console.log("Transaction Success");
}

main();
