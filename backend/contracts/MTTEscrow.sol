
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract MTTEscrow is ReentrancyGuard {
    using Address for address;

    address public immutable owner;
    uint256 private constant DENOMINATOR = 10000;
    uint256 public commissionRate = 100; // 1% (basis points)
    address public commissionWallet;

    struct Deal {
        address buyer;
        address seller;
        uint256 amount;
        uint256 deadline;
        bool isReleased;
        bool isRefunded;
    }

    mapping(uint256 => Deal) public deals;
    uint256 public dealCount;

    error Unauthorized();
    error InvalidDeadline();
    error InsufficientValue();
    error FundsAlreadyProcessed();
    error DeadlineExceeded();
    error DeadlineNotExceeded();
    error TransferFailed();

    event DealCreated(uint256 indexed dealId, address indexed buyer, address indexed seller, uint256 amount, uint256 deadline);
    event FundsReleased(uint256 indexed dealId, address indexed seller, uint256 amount);
    event FundsRefunded(uint256 indexed dealId, address indexed buyer, uint256 amount);
    event DisputeResolved(uint256 indexed dealId, string resolution);

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(address _commissionWallet) {
        owner = msg.sender;
        commissionWallet = _commissionWallet;
    }

    function createDeal(address _seller, uint256 _deadline) external payable nonReentrant returns (uint256) {
        if (_deadline <= block.timestamp) revert InvalidDeadline();
        if (msg.value == 0) revert InsufficientValue();

        unchecked {
            dealCount++;
        }

        deals[dealCount] = Deal({
            buyer: msg.sender,
            seller: _seller,
            amount: msg.value,
            deadline: _deadline,
            isReleased: false,
            isRefunded: false
        });

        emit DealCreated(dealCount, msg.sender, _seller, msg.value, _deadline);
        return dealCount;
    }

    function releaseFunds(uint256 dealId) external nonReentrant {
        Deal storage deal = deals[dealId];
        if (msg.sender != deal.buyer && msg.sender != owner) revert Unauthorized();
        if (deal.isReleased || deal.isRefunded) revert FundsAlreadyProcessed();
        if (block.timestamp > deal.deadline) revert DeadlineExceeded();

        deal.isReleased = true;
        uint256 commission = (deal.amount * commissionRate) / DENOMINATOR;
        uint256 sellerAmount = deal.amount - commission;

        (bool successCommission, ) = commissionWallet.call{value: commission}("");
        if (!successCommission) revert TransferFailed();
        
        (bool successSeller, ) = deal.seller.call{value: sellerAmount}("");
        if (!successSeller) revert TransferFailed();

        emit FundsReleased(dealId, deal.seller, sellerAmount);
    }

    function refundFunds(uint256 dealId) external nonReentrant {
        Deal storage deal = deals[dealId];
        if (msg.sender != deal.buyer && msg.sender != owner) revert Unauthorized();
        if (deal.isReleased || deal.isRefunded) revert FundsAlreadyProcessed();
        if (block.timestamp <= deal.deadline) revert DeadlineNotExceeded();

        deal.isRefunded = true;
        (bool success, ) = deal.buyer.call{value: deal.amount}("");
        if (!success) revert TransferFailed();

        emit FundsRefunded(dealId, deal.buyer, deal.amount);
    }

    function resolveDispute(uint256 dealId, bool favorSeller) external onlyOwner nonReentrant {
        Deal storage deal = deals[dealId];
        if (deal.isReleased || deal.isRefunded) revert FundsAlreadyProcessed();

        if (favorSeller) {
            deal.isReleased = true;
            uint256 commission = (deal.amount * commissionRate) / DENOMINATOR;
            uint256 sellerAmount = deal.amount - commission;

            (bool successCommission, ) = commissionWallet.call{value: commission}("");
            if (!successCommission) revert TransferFailed();
            
            (bool successSeller, ) = deal.seller.call{value: sellerAmount}("");
            if (!successSeller) revert TransferFailed();
            
            emit DisputeResolved(dealId, "Funds released to seller");
        } else {
            deal.isRefunded = true;
            (bool success, ) = deal.buyer.call{value: deal.amount}("");
            if (!success) revert TransferFailed();
            emit DisputeResolved(dealId, "Funds refunded to buyer");
        }
    }
}
