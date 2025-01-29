const express = require("express");
const router = express.Router();
const { verifyToken, checkRole } = require("../middleware/authMiddleware");
const adminController = require("../controllers/adminController");
const adminLogger = require("../middleware/adminLogger");

// Применяем логгер ко всем админ роутам
router.use(adminLogger);

// User management routes
router.get("/users", verifyToken, checkRole("admin"), adminController.getUsers);
router.get("/users/:id", verifyToken, checkRole("admin"), adminController.getUserById);
router.patch("/users/:id/role", verifyToken, checkRole("admin"), adminController.updateUserRole);
router.patch("/users/:id/status", verifyToken, checkRole("admin"), adminController.updateUserStatus);
router.delete("/users/:id", verifyToken, checkRole("admin"), adminController.deleteUser);

// Commission management
router.post("/commission", verifyToken, checkRole("admin"), adminController.updateCommission);

// Export routes
router.get("/export/users", verifyToken, checkRole("admin"), adminController.exportUserData);
router.get("/export/deals", verifyToken, checkRole("admin"), adminController.exportDealData);

// Admin logs
router.get("/logs", verifyToken, checkRole("admin"), adminController.getAdminLogs);

module.exports = router;