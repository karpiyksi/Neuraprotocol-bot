# **Neuraprotocol-bot**
*Automated bot for interacting with the **Neuraprotocol Testnet**. Transfers ANKR and ERC-20 tokens, performing swaps, faucet claims, daily check-ins and etc.*

---

## **✨ Key Features**

✅ **ANKR Transfers**: Sends small amounts of **ANKR** to random addresses from the wallet.txt file.  
✅ **ERC-20 tokens Transfers**: Sends small amounts of **ERC-20 tokens** to random addresses.  
✅ **Automated Swaps**: *Soon*  
✅ **Faucet Claims**: *Soon*  
✅ **Daily Check-ins**: *Soon*  
✅ **Multi-wallet Support**: Processes multiple wallets sequentially  

---

## **🚀 Getting Started**

1. Clone the Repository
```bash
git clone https://github.com/karpiyksi/Neuraprotocol-bot.git
cd Neuraprotocol-bot
```
2. Install dependencies:
```bash
npm init -y
npm install ethers axios dotenv
```
3. Create a .env file in the root directory with your RPC and private keys:
```bash
RPC_URL=https://testnet.rpc.neuraprotocol.io/  # RPC
PRIVATE_KEY_1=first_private_key
PRIVATE_KEY_2=second_private_key
```
**wallet.txt** - Add target addresses for transfers (one per line) or use these 60k addresses:
```
0xc37bf0c7b3bdfb91d09dfdf5c946142c505a9fa8
0xabeeef3a7900904257ecc98134a248c9edc2a16d
0x4d1aa3918b620e31aa29862a4eefa4327776d6e4
```
## Usage 🚀

Run the bot:
```bash
node sendERC20Token.js
```
*The mailing progress is saved in the progress.json file. The mailing progress is saved in the progress.json file. When launched again, the bot resumes the mailing from the address where it stopped.*

## Important Notes ⚠️
1. This bot is intended for use on the testnet only.
2. Never use mainnet private keys.
3. To stop the bot, use (Ctrl+C).

## Disclaimer ⚠️
This software is provided "as is" without any warranty. Use it at your own risk. The developers are not responsible for any damages or problems arising from using this bot.

## Thank You Wallet
**EVM:** 0x55aF595D9c317aE35b1E96d5BB7caB8188b9Fd55  
Thank you for visiting this repository! If you have any questions, spot a problem, or have suggestions for improvement, please contact me or create an issue in this GitHub repository.
