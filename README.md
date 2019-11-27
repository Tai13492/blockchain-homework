# blockchain-homework
This repository is part of a homework submission of a blockchain course

# How to duplicate results
0. Make sure you have node and python installed on your machine
1. run ```npm install -g solc && npm install```
2. register an account at metamask and infura.io
3. create a .env file, see an example at .env.example
3. replace WEB3_PROVIDER in .env with an infura generated url, e.g. https://ropsten.infura.io/v3/loremipsum
4. replace PRIVATE_KEY in .env with your metamask private key
5. replace HASH_SECRET in .env with any secret, e.g. TaiHasBigLegs
6. replace studentID in p3.sol
7. run ```solcjs --bin --abi p3.sol```
8. run ```node p2.js``` to finish question 2
9. run ```node p3.js``` to finish question 3
