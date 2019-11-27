const Web3 = require("web3");
const Tx = require("ethereumjs-tx").Transaction;
const crypto = require("crypto");
const fs = require("mz/fs");

const filename = "p3.js";
const solFileName = "p3_sol_P3";
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

function generateABI(studentID, hex, contractAddress) {
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
        },
        {
          internalType: "address",
          name: "yourContract",
          type: "address"
        }
      ],
      name: "Problem3",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    [studentID, hex, contractAddress]
  );
}
async function retrieveSolidityFile() {
  console.log("retrieving solidity file...");
  const [readBinError, binFile] = await promiseWrapper(
    fs.readFile(`${solFileName}.bin`, "utf8")
  );
  if (readBinError) throw new Error(readBinError);
  console.log(`binary file: ${binFile}`);
  return binFile;
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

async function deployContract(contract) {
  console.log("deploying contract ...");
  const [error, receipt] = await promiseWrapper(
    ETH.sendSignedTransaction(contract)
  );
  if (error) throw new Error(error);
  console.log(receipt);
  console.log(`Contract Address: ${receipt.contractAddress}`);
  return receipt.contractAddress;
}

function serializeTransaction(txObject, private_key) {
  console.log("serializing transaction...");
  const tx = new Tx(txObject, { chain: "ropsten" });
  tx.sign(private_key);
  let serializeTx = tx.serialize();
  serializeTx = `0x${serializeTx.toString("hex")}`;
  console.log(`serialized transaction: ${serializeTx}`);
  return serializeTx;
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
  // Create Solidity data (Contract) from solidity file
  const bin = await retrieveSolidityFile();
  let nonce = await getTransactionCount();
  const data = `0x${bin}`;

  // Prepare contract transaction object
  const txContractObject = {
    nonce: nonce,
    gasLimit: toHex(3 * Math.pow(10, 6)),
    gasPrice: toHex(toWei("5", "gwei")),
    data
  };

  // Prepare private key
  const private_key = Buffer.from(PRIVATE_KEY, "hex");

  // Sign a contract with our credentials
  const serializedContractTx = serializeTransaction(
    txContractObject,
    private_key
  );

  // Deploy our contract
  const myContractAddress = await deployContract(serializedContractTx);

  // Retrieve updated nonce and hash solution file
  nonce = await getTransactionCount();
  hex = await hashSolutionFile();

  // Create Q3 transaction object
  const abi = generateABI(MY_STUDENT_ID, hex, myContractAddress);
  const txObject = {
    nonce: toHex(nonce),
    to: DESTINATION_ADDRESS,
    gasLimit: toHex(3 * Math.pow(10, 6)),
    gasPrice: toHex(toWei("5", "gwei")),
    data: abi
  };
  // Serialize transaction object with our credentials
  const serializedTx = serializeTransaction(txObject, private_key);

  await sendSignedTransaction(serializedTx);
  console.log("Transaction Success");
}

main();
