const tronWeb = require('../utils/tronWeb');

// Адрес смарт-контракта
const contractAddress = process.env.ESCROW_CONTRACT_ADDRESS;

/**
 * Внесение средств в эскроу
 */
async function depositFunds(to, amount) {
  if (!to || !amount) {
    return { success: false, error: 'Invalid parameters: to and amount are required.' };
  }

  try {
    const contract = await tronWeb.contract().at(contractAddress);

    // Вызов метода депозита
    const tx = await contract.deposit(to, amount).send({
      feeLimit: 100000000,
    });

    console.log('Deposit transaction successful:', tx);
    return { success: true, tx };
  } catch (error) {
    console.error('Error in depositFunds:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Разблокировка средств из эскроу
 */
async function releaseFunds(from, amount) {
  if (!from || !amount) {
    return { success: false, error: 'Invalid parameters: from and amount are required.' };
  }

  try {
    const contract = await tronWeb.contract().at(contractAddress);

    // Вызов метода разблокировки
    const tx = await contract.release(from, amount).send({
      feeLimit: 100000000,
    });

    console.log('Release transaction successful:', tx);
    return { success: true, tx };
  } catch (error) {
    console.error('Error in releaseFunds:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Возврат средств покупателю
 */
async function refundFunds(to, amount) {
  if (!to || !amount) {
    return { success: false, error: 'Invalid parameters: to and amount are required.' };
  }

  try {
    const contract = await tronWeb.contract().at(contractAddress);

    // Вызов метода возврата средств
    const tx = await contract.refund(to, amount).send({
      feeLimit: 100000000,
    });

    console.log('Refund transaction successful:', tx);
    return { success: true, tx };
  } catch (error) {
    console.error('Error in refundFunds:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Проверка баланса смарт-контракта
 */
async function getContractBalance() {
  try {
    const contract = await tronWeb.contract().at(contractAddress);
    const balance = await contract.getBalance().call();

    console.log('Contract balance:', balance);
    return { success: true, balance };
  } catch (error) {
    console.error('Error fetching contract balance:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { depositFunds, releaseFunds, refundFunds, getContractBalance };

