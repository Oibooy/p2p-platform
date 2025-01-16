const tronWeb = require('../utils/tronWeb');
const dotenv = require('dotenv');
const EventEmitter = require('events');
const { saveEventToDatabase, notifyUsers } = require('./utils/eventHandlers'); // Утилиты для работы с событиями

dotenv.config();

const escrowContractAddress = process.env.ESCROW_CONTRACT_ADDRESS;

// Класс для управления событиями
class ContractEventListener extends EventEmitter {
    constructor() {
        super();
        this.contract = null;
    }

    async initialize() {
        try {
            this.contract = await tronWeb.contract().at(escrowContractAddress);
            console.log('Connected to smart contract:', escrowContractAddress);
        } catch (error) {
            console.error('Error initializing contract listener:', error.message);
            process.exit(1);
        }
    }

    listenToEvents() {
        if (!this.contract) {
            console.error('Contract not initialized. Call initialize() first.');
            return;
        }

        // Подписка на событие DealCreated
        this.contract.DealCreated().watch(async (err, event) => {
            if (err) {
                console.error('Error watching DealCreated event:', err.message);
            } else {
                console.log('DealCreated:', event);
                await this.handleEvent('DealCreated', event);
            }
        });

        // Подписка на событие FundsReleased
        this.contract.FundsReleased().watch(async (err, event) => {
            if (err) {
                console.error('Error watching FundsReleased event:', err.message);
            } else {
                console.log('FundsReleased:', event);
                await this.handleEvent('FundsReleased', event);
            }
        });

        // Подписка на событие FundsRefunded
        this.contract.FundsRefunded().watch(async (err, event) => {
            if (err) {
                console.error('Error watching FundsRefunded event:', err.message);
            } else {
                console.log('FundsRefunded:', event);
                await this.handleEvent('FundsRefunded', event);
            }
        });

        console.log('Event listeners started...');
    }

    async handleEvent(eventType, event) {
        try {
            // Сохранение события в базе данных
            await saveEventToDatabase(eventType, event);

            // Уведомление пользователей
            await notifyUsers(eventType, event);

            console.log(`Handled event: ${eventType}`);
        } catch (error) {
            console.error(`Error handling event ${eventType}:`, error.message);
        }
    }
}

// Утилиты для работы с событиями
async function saveEventToDatabase(eventType, event) {
    // Пример сохранения события в базу данных
    console.log(`Saving event to database: ${eventType}`, event);
    // Здесь реализуйте сохранение в MongoDB
}

async function notifyUsers(eventType, event) {
    // Пример уведомления пользователей через WebSocket
    console.log(`Notifying users about event: ${eventType}`, event);
    // Здесь реализуйте отправку уведомлений
}

// Запуск подписки на события
(async () => {
    const eventListener = new ContractEventListener();
    await eventListener.initialize();
    eventListener.listenToEvents();
})();


