const tronWeb = require('../utils/tronWeb');
const dotenv = require('dotenv');

dotenv.config();

const escrowContractAddress = process.env.ESCROW_CONTRACT_ADDRESS;

async function testCreateDeal() {
    try {
        const sellerAddress = 'TJqLzXmKes3wwD4Mm3SrRMQ6KPALzWGzBA'; // Адрес продавца
        const amount = 1000000; // 1 USDT в минимальных единицах

        const contract = await tronWeb.contract().at(escrowContractAddress);

        console.log('Creating deal...');
        const tx = await contract.createDeal(sellerAddress, amount).send({
            feeLimit: 100000000,
        });
        console.log('Deal created successfully:', tx);
    } catch (error) {
        console.error('Error in createDeal:', error);
    }
}

async function testReleaseFunds(dealId) {
    try {
        const contract = await tronWeb.contract().at(escrowContractAddress);

        console.log(`Releasing funds for deal ${dealId}...`);
        const tx = await contract.releaseFunds(dealId).send({
            feeLimit: 100000000,
        });
        console.log('Funds released successfully:', tx);
    } catch (error) {
        console.error('Error in releaseFunds:', error);
    }
}

async function testRefundFunds(dealId) {
    try {
        const contract = await tronWeb.contract().at(escrowContractAddress);

        console.log(`Refunding funds for deal ${dealId}...`);
        const tx = await contract.refundFunds(dealId).send({
            feeLimit: 100000000,
        });
        console.log('Funds refunded successfully:', tx);
    } catch (error) {
        console.error('Error in refundFunds:', error);
    }
}

async function runTests() {
    await testCreateDeal();
    await testReleaseFunds(1); // Укажите ID сделки
    await testRefundFunds(1); // Укажите ID сделки
}

runTests();
