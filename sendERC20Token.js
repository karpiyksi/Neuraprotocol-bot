import { ethers } from "ethers";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

// Конфигурация кошельков
const walletsConfig = [
  {
    privateKey: process.env.PRIVATE_KEY_1,
    tokenAddress: "0x1aB357522Ed5c1a76f361520DEC1b02a3eD04014", // ETH Token
    minAmount: 1,
    maxAmount: 10,
  },
  {
    privateKey: process.env.PRIVATE_KEY_2,
    tokenAddress: "0x5e06D1bd47dd726A9bcd637e3D2F86B236e50c26", // BTC Token
    minAmount: 2,
    maxAmount: 15,
  },

  // Если кошельков больше, добавляем кошельки из env 
];

const config = {
  rpcUrl: process.env.RPC_URL,
  walletsFile: "wallet.txt",
  progressFile: "progress.json",
  gasLimit: 100000,
  gasPriceMultiplier: 1.2,
  delayBetweenTxs: 2000, // Задержка между транзакциями (мс)
  maxRetries: 5, // Максимальное количество повторных попыток при ошибке RPC
  retryDelay: 5000, // Задержка между повторными попытками (мс)
};

// ABI ERC-20
const erc20Abi = [
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

// Чтение адресов получателей
function readWallets(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  return data
    .split("\n")
    .map((addr) => addr.trim())
    .filter((addr) => ethers.isAddress(addr));
}

// Сохранение прогресса
function saveProgress(walletIndex, recipientIndex) {
  fs.writeFileSync(
    config.progressFile,
    JSON.stringify({ walletIndex, recipientIndex })
  );
}

// Загрузка прогресса
function loadProgress() {
  try {
    if (fs.existsSync(config.progressFile)) {
      const data = JSON.parse(fs.readFileSync(config.progressFile, "utf8"));
      return {
        walletIndex: data.walletIndex || 0,
        recipientIndex: data.recipientIndex || -1,
      };
    }
  } catch (err) {
    console.error("Ошибка загрузки прогресса:", err);
  }
  return { walletIndex: 0, recipientIndex: -1 };
}

// Генерация случайной суммы
function getRandomAmount(walletConfig) {
  return (
    Math.floor(
      Math.random() * (walletConfig.maxAmount - walletConfig.minAmount + 1)
    ) + walletConfig.minAmount
  );
}

// Проверка подключения к RPC
async function checkRPCConnection(provider) {
  try {
    await provider.getBlockNumber();
    return true;
  } catch (err) {
    console.error("Ошибка подключения к RPC:", err.message);
    return false;
  }
}

// Повторное подключение к RPC
async function reconnectRPC() {
  let retries = 0;
  let provider;

  while (retries < config.maxRetries) {
    try {
      provider = new ethers.JsonRpcProvider(config.rpcUrl);
      const isConnected = await checkRPCConnection(provider);
      if (isConnected) {
        console.log("✅ Подключение к RPC восстановлено!");
        return provider;
      }
    } catch (err) {
      console.error(`Попытка ${retries + 1}: Не удалось подключиться к RPC.`);
    }

    retries++;
    if (retries < config.maxRetries) {
      console.log(`⏳ Повторная попытка через ${config.retryDelay / 1000} секунд...`);
      await new Promise((resolve) => setTimeout(resolve, config.retryDelay));
    }
  }

  throw new Error(`❌ Не удалось восстановить подключение к RPC после ${config.maxRetries} попыток.`);
}

// Основная функция рассылки
async function sendTokens() {
  const recipients = readWallets(config.walletsFile);
  if (recipients.length === 0) {
    console.error("Нет валидных адресов в файле!");
    return;
  }

  let provider = new ethers.JsonRpcProvider(config.rpcUrl);
  let isConnected = await checkRPCConnection(provider);
  if (!isConnected) {
    provider = await reconnectRPC();
  }

  const { walletIndex: startWalletIndex, recipientIndex: startRecipientIndex } = loadProgress();
  console.log(`🔄 Начинаем с кошелька ${startWalletIndex + 1}, получателя ${startRecipientIndex + 1}`);

  // Проверка балансов всех кошельков
  for (const walletConfig of walletsConfig) {
    const wallet = new ethers.Wallet(walletConfig.privateKey, provider);
    const tokenContract = new ethers.Contract(walletConfig.tokenAddress, erc20Abi, wallet);
    const balance = await tokenContract.balanceOf(wallet.address);
    const decimals = await tokenContract.decimals();
    const symbol = await tokenContract.symbol();

    console.log(
      `Кошелёк ${wallet.address}: ${ethers.formatUnits(balance, decimals)} ${symbol}`
    );
  }

  // Основной цикл рассылки
  let currentRecipientIndex = startRecipientIndex;
  let currentWalletIndex = startWalletIndex;

  while (currentRecipientIndex < recipients.length - 1) {
    currentRecipientIndex++;
    const walletConfig = walletsConfig[currentWalletIndex];
    const recipient = recipients[currentRecipientIndex];

    try {
      // Проверка подключения перед каждой транзакцией
      isConnected = await checkRPCConnection(provider);
      if (!isConnected) {
        console.log("⚠️  RPC недоступен. Пытаемся восстановить подключение...");
        provider = await reconnectRPC();
      }

      const wallet = new ethers.Wallet(walletConfig.privateKey, provider);
      const tokenContract = new ethers.Contract(walletConfig.tokenAddress, erc20Abi, wallet);

      const decimals = await tokenContract.decimals();
      const symbol = await tokenContract.symbol();
      const randomAmount = getRandomAmount(walletConfig);
      const amount = ethers.parseUnits(randomAmount.toString(), decimals);

      // Настройка газа
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice;
      const multiplier = BigInt(Math.floor(config.gasPriceMultiplier * 100));
      const adjustedGasPrice = (gasPrice * multiplier) / 100n;

      console.log(
        `[${currentRecipientIndex + 1}/${recipients.length}] Кошелёк ${
          currentWalletIndex + 1
        }/${walletsConfig.length}: Отправка ${
          walletConfig.minAmount
        }-${walletConfig.maxAmount} ${symbol} на ${recipient}...`
      );

      const tx = await tokenContract.transfer(recipient, amount, {
        gasLimit: config.gasLimit,
        gasPrice: adjustedGasPrice,
      });

      console.log(`Транзакция отправлена. TX: ${tx.hash}`);
      await tx.wait();
      console.log(`✅ Успешно отправлено на ${recipient}`);

      saveProgress(currentWalletIndex, currentRecipientIndex);
    } catch (err) {
      console.error(`❌ Ошибка при отправке на ${recipient}:`, err.message);

      // Критические ошибки (недостаточно средств, газ и т.д.)
      if (
        err.message.includes("insufficient funds") ||
        err.message.includes("gas") ||
        err.message.includes("rejected") ||
        err.message.includes("reverted")
      ) {
        console.error("❌ Критическая ошибка. Останавливаем рассылку.");
        break;
      }

      // Ошибки сети (повторяем попытку)
      if (err.message.includes("network") || err.message.includes("RPC")) {
        console.log("⚠️  Ошибка сети. Повторяем попытку...");
        currentRecipientIndex--; // Возвращаемся к текущему получателю
        await new Promise((resolve) => setTimeout(resolve, config.retryDelay));
        continue;
      }

      saveProgress(currentWalletIndex, currentRecipientIndex);
    }

    // Переключение на следующий кошелёк (round-robin)
    currentWalletIndex = (currentWalletIndex + 1) % walletsConfig.length;

    // Задержка между транзакциями
    if (currentRecipientIndex < recipients.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, config.delayBetweenTxs));
    }
  }

  console.log("🎉 Рассылка завершена!");
}

sendTokens().catch(console.error);