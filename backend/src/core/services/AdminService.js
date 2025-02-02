// src/core/services/adminService.js (Рефакторинг + управление администраторами)
const { AdminRepository } = require('../../db/repositories/AdminRepository');
const { DisputeRepository } = require('../../db/repositories/DisputeRepository');
const logger = require('../../infrastructure/logger');
const metrics = require('../../infrastructure/metrics');

class AdminService {
    constructor() {
        this.adminRepository = new AdminRepository();
        this.disputeRepository = new DisputeRepository();
    }

    async createAdmin(adminData) {
        try {
            logger.info(`Creating admin: ${adminData.username}`);
            
            const existingAdmin = await this.adminRepository.findByUsername(adminData.username);
            if (existingAdmin) throw new Error('Admin already exists');
            
            const admin = await this.adminRepository.create(adminData);
            metrics.increment('admins.created');
            return admin;
        } catch (error) {
            logger.error(`Admin creation error: ${error.message}`);
            throw error;
        }
    }

    async resolveDispute(disputeId, resolution, adminId) {
        try {
            logger.info(`Admin ${adminId} resolving dispute ${disputeId}`);
            
            const dispute = await this.disputeRepository.findById(disputeId);
            if (!dispute) throw new Error('Dispute not found');
            if (dispute.status !== 'OPEN') throw new Error('Dispute is not open');
            
            await this.disputeRepository.updateStatus(disputeId, 'RESOLVED', resolution, adminId);
            metrics.increment('disputes.resolved_by_admin');
            return { success: true, resolution };
        } catch (error) {
            logger.error(`Admin dispute resolution error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new AdminService();
