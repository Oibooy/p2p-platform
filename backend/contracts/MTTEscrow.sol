// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract MTTEscrow is ReentrancyGuard {
    using Address for address;

    IERC20 public immutable mttToken;
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
    error TransferFailed();
    error FundsAlreadyProcessed();
    error DeadlineExceeded();
    error DeadlineNotExceeded();

    event DealCreated(uint256 indexed dealId, address indexed buyer, address indexed seller, uint256 amount, uint256 deadline);
    event FundsReleased(uint256 indexed dealId, address indexed seller, uint256 amount);
    event FundsRefunded(uint256 indexed dealId, address indexed buyer, uint256 amount);
    event DisputeResolved(uint256 indexed dealId, string resolution);

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(address _mttToken, address _commissionWallet) {
        mttToken = IERC20(_mttToken);
        owner = msg.sender;
        commissionWallet = _commissionWallet;
    }

    function createDeal(address _seller, uint256 _amount, uint256 _deadline) external nonReentrant returns (uint256) {
        if (_deadline <= block.timestamp) revert InvalidDeadline();
        if (!mttToken.transferFrom(msg.sender, address(this), _amount)) revert TransferFailed();

        unchecked {
            dealCount++;
        }

        deals[dealCount] = Deal({
            buyer: msg.sender,
            seller: _seller,
            amount: _amount,
            deadline: _deadline,
            isReleased: false,
            isRefunded: false
        });

        emit DealCreated(dealCount, msg.sender, _seller, _amount, _deadline);
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

        if (!mttToken.transfer(commissionWallet, commission)) revert TransferFailed();
        if (!mttToken.transfer(deal.seller, sellerAmount)) revert TransferFailed();

        emit FundsReleased(dealId, deal.seller, sellerAmount);
    }

    function refundFunds(uint256 dealId) external nonReentrant {
        Deal storage deal = deals[dealId];
        if (msg.sender != deal.buyer && msg.sender != owner) revert Unauthorized();
        if (deal.isReleased || deal.isRefunded) revert FundsAlreadyProcessed();
        if (block.timestamp <= deal.deadline) revert DeadlineNotExceeded();

        deal.isRefunded = true;
        if (!mttToken.transfer(deal.buyer, deal.amount)) revert TransferFailed();

        emit FundsRefunded(dealId, deal.buyer, deal.amount);
    }

    function resolveDispute(uint256 dealId, bool favorSeller) external onlyOwner nonReentrant {
        Deal storage deal = deals[dealId];
        if (deal.isReleased || deal.isRefunded) revert FundsAlreadyProcessed();

        if (favorSeller) {
            deal.isReleased = true;
            uint256 commission = (deal.amount * commissionRate) / DENOMINATOR;
            uint256 sellerAmount = deal.amount - commission;

            if (!mttToken.transfer(commissionWallet, commission)) revert TransferFailed();
            if (!mttToken.transfer(deal.seller, sellerAmount)) revert TransferFailed();
            emit DisputeResolved(dealId, "Funds released to seller");
        } else {
            deal.isRefunded = true;
            if (!mttToken.transfer(deal.buyer, deal.amount)) revert TransferFailed();
            emit DisputeResolved(dealId, "Funds refunded to buyer");
        }
    }
}
