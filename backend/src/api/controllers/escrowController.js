const EscrowService = require('../core/services/EscrowService');

class EscrowController {
  static async lockFunds(req, res) {
    try {
      const response = await EscrowService.lockFunds(req.user.id, req.body.orderId, req.body.amount);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: 'Failed to lock funds' });
    }
  }

  static async releaseFunds(req, res) {
    try {
      const response = await EscrowService.releaseFunds(req.user.id, req.body.orderId, req.body.amount);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: 'Failed to release funds' });
    }
  }
}

module.exports = EscrowController;

// escrowApi.js - API для управления P2P-сделками в бэкенде

const express = require('express');
const Web3 = require('web3');
const { Deal } = require('../models/Deal');
const MTTEscrowABI = require('../contracts/MTTEscrowABI.json');
const config = require('../config');

const router = express.Router();
const web3 = new Web3(config.provider);
const escrowContract = new web3.eth.Contract(MTTEscrowABI, config.escrowAddress);

// 🔥 API для возврата средств покупателем (если продавец пропал)
router.post('/buyerRefund/:dealId', async (req, res) => {
    try {
        const { dealId } = req.params;
        const deal = await Deal.findOne({ id: dealId });

        if (!deal) {
            return res.status(404).json({ error: 'Сделка не найдена' });
        }
        if (deal.isReleased) {
            return res.status(400).json({ error: 'Средства уже выпущены, возврат невозможен' });
        }
        if (Date.now() < deal.deadline) {
            return res.status(400).json({ error: 'Deadline еще не истек' });
        }

        // Вызываем cancelDeal() от имени продавца
        const tx = await escrowContract.methods
            .cancelDeal(dealId)
            .send({ from: deal.seller });

        deal.isRefunded = true;
        await deal.save();
        res.json({ success: true, txHash: tx.transactionHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔥 API для принудительного перевода MTT покупателю (если продавец не ответил)
router.post('/forceRelease/:dealId', async (req, res) => {
    try {
        const { dealId } = req.params;
        const deal = await Deal.findOne({ id: dealId });

        if (!deal) {
            return res.status(404).json({ error: 'Сделка не найдена' });
        }
        if (deal.isReleased) {
            return res.status(400).json({ error: 'Средства уже выпущены' });
        }
        if (Date.now() < deal.deadline) {
            return res.status(400).json({ error: 'Deadline еще не истек' });
        }

        // Вызываем releaseFunds() от имени продавца
        const tx = await escrowContract.methods
            .releaseFunds(dealId)
            .send({ from: deal.seller });

        deal.isReleased = true;
        await deal.save();
        res.json({ success: true, txHash: tx.transactionHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;