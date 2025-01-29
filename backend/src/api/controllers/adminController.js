
const UserRepository = require('../../db/repositories/UserRepository');
const AdminLogRepository = require('../../db/repositories/AdminLogRepository');
const { ValidationError, AppError } = require('../../infrastructure/errors');
const { exportUsers, exportDeals } = require('../../core/services/exportService');

class AdminController {
  async getUsers(req, res) {
    const { page = 1, limit = 10, role, status, search } = req.query;
    
    try {
      const filter = {};
      if (role) filter.role = role;
      if (status) filter.isActive = status === "active";
      if (search) filter.username = { $regex: search, $options: "i" };

      const skip = (page - 1) * limit;
      const users = await UserRepository.find(filter)
        .skip(skip)
        .limit(parseInt(limit))
        .select("-password");

      const total = await UserRepository.countDocuments(filter);

      res.json({ users, total });
    } catch (error) {
      throw new AppError('Failed to fetch users', 500);
    }
  }

  async getUserById(req, res) {
    try {
      const user = await UserRepository.findById(req.params.id).select("-password");
      if (!user) {
        throw new ValidationError('User not found');
      }
      res.json(user);
    } catch (error) {
      throw new AppError('Failed to fetch user', 500);
    }
  }

  async updateUserRole(req, res) {
    const { role } = req.body;
    if (!["user", "moderator", "admin"].includes(role)) {
      throw new ValidationError('Invalid role specified');
    }

    try {
      const user = await UserRepository.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true }
      );
      if (!user) {
        throw new ValidationError('User not found');
      }
      res.json(user);
    } catch (error) {
      throw new AppError('Failed to update user role', 500);
    }
  }

  async updateUserStatus(req, res) {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      throw new ValidationError('Invalid status specified');
    }

    try {
      const user = await UserRepository.findByIdAndUpdate(
        req.params.id,
        { isActive: status === "active" },
        { new: true }
      );
      if (!user) {
        throw new ValidationError('User not found');
      }
      res.json(user);
    } catch (error) {
      throw new AppError('Failed to update user status', 500);
    }
  }

  async deleteUser(req, res) {
    try {
      const user = await UserRepository.findByIdAndDelete(req.params.id);
      if (!user) {
        throw new ValidationError('User not found');
      }
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      throw new AppError('Failed to delete user', 500);
    }
  }

  async updateCommission(req, res) {
    try {
      const { newRate } = req.body;
      if (newRate < 0 || newRate > 1000) {
        throw new ValidationError('Commission rate must be between 0 and 1000 basis points');
      }
      const escrowContract = await ethers.getContractAt(
        "MTTEscrow",
        process.env.ESCROW_CONTRACT_ADDRESS
      );
      const tx = await escrowContract.setCommissionRate(newRate);
      await tx.wait();
      res.json({ message: "Commission rate updated successfully", newRate });
    } catch (error) {
      throw new AppError('Failed to update commission rate', 500);
    }
  }

  async getAdminLogs(req, res) {
    try {
      const logs = await AdminLogRepository.find()
        .populate("admin", "username email")
        .sort({ timestamp: -1 })
        .limit(100);
      res.json(logs);
    } catch (error) {
      throw new AppError('Failed to fetch admin logs', 500);
    }
  }

  async exportUserData(req, res) {
    try {
      const csv = await exportUsers();
      res.header("Content-Type", "text/csv");
      res.attachment("users.csv");
      res.send(csv);
    } catch (error) {
      throw new AppError('Failed to export users', 500);
    }
  }

  async exportDealData(req, res) {
    try {
      const csv = await exportDeals();
      res.header("Content-Type", "text/csv");
      res.attachment("deals.csv");
      res.send(csv);
    } catch (error) {
      throw new AppError('Failed to export deals', 500);
    }
  }
}

module.exports = new AdminController();
