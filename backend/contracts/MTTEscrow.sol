
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MTTEscrow is ReentrancyGuard {
    IERC20 public mttToken;
    address public owner;

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

    event DealCreated(uint256 dealId, address indexed buyer, address indexed seller, uint256 amount, uint256 deadline);
    event FundsReleased(uint256 dealId, address indexed seller, uint256 amount);
    event FundsRefunded(uint256 dealId, address indexed buyer, uint256 amount);
    event DisputeResolved(uint256 dealId, string resolution);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor(address _mttToken) {
        mttToken = IERC20(_mttToken);
        owner = msg.sender;
    }

    function createDeal(address _seller, uint256 _amount, uint256 _deadline) external nonReentrant returns (uint256) {
        require(_deadline > block.timestamp, "Invalid deadline");
        require(mttToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        dealCount++;
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
        require(msg.sender == deal.buyer || msg.sender == owner, "Unauthorized");
        require(!deal.isReleased && !deal.isRefunded, "Funds already processed");
        require(block.timestamp <= deal.deadline, "Deadline exceeded");

        deal.isReleased = true;
        require(mttToken.transfer(deal.seller, deal.amount), "Transfer failed");

        emit FundsReleased(dealId, deal.seller, deal.amount);
    }

    function refundFunds(uint256 dealId) external nonReentrant {
        Deal storage deal = deals[dealId];
        require(msg.sender == deal.buyer || msg.sender == owner, "Unauthorized");
        require(!deal.isReleased && !deal.isRefunded, "Funds already processed");
        require(block.timestamp > deal.deadline, "Deadline not exceeded");

        deal.isRefunded = true;
        require(mttToken.transfer(deal.buyer, deal.amount), "Transfer failed");

        emit FundsRefunded(dealId, deal.buyer, deal.amount);
    }

    function resolveDispute(uint256 dealId, bool favorSeller) external onlyOwner nonReentrant {
        Deal storage deal = deals[dealId];
        require(!deal.isReleased && !deal.isRefunded, "Funds already processed");

        if (favorSeller) {
            deal.isReleased = true;
            require(mttToken.transfer(deal.seller, deal.amount), "Transfer failed");
            emit DisputeResolved(dealId, "Funds released to seller");
        } else {
            deal.isRefunded = true;
            require(mttToken.transfer(deal.buyer, deal.amount), "Transfer failed");
            emit DisputeResolved(dealId, "Funds refunded to buyer");
        }
    }
}
