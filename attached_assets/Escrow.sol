// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Escrow {
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
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }

    modifier onlyBuyer(uint256 dealId) {
        require(msg.sender == deals[dealId].buyer, "Only buyer can perform this action.");
        _;
    }

    modifier onlySeller(uint256 dealId) {
        require(msg.sender == deals[dealId].seller, "Only seller can perform this action.");
        _;
    }

    modifier dealExists(uint256 dealId) {
        require(deals[dealId].buyer != address(0), "Deal does not exist.");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createDeal(address _seller, uint256 _amount, uint256 _deadline) external payable returns (uint256) {
        require(msg.value == _amount, "Incorrect amount sent.");
        require(_deadline > block.timestamp, "Invalid deadline.");

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

    function releaseFunds(uint256 dealId) external dealExists(dealId) onlyBuyer(dealId) {
        Deal storage deal = deals[dealId];
        require(!deal.isReleased, "Funds already released.");
        require(!deal.isRefunded, "Funds already refunded.");
        require(block.timestamp <= deal.deadline, "Deadline exceeded.");

        deal.isReleased = true;
        payable(deal.seller).transfer(deal.amount);

        emit FundsReleased(dealId, deal.seller, deal.amount);
    }

    function refundFunds(uint256 dealId) external dealExists(dealId) onlyBuyer(dealId) {
        Deal storage deal = deals[dealId];
        require(!deal.isReleased, "Funds already released.");
        require(!deal.isRefunded, "Funds already refunded.");
        require(block.timestamp > deal.deadline, "Deadline not yet exceeded.");

        deal.isRefunded = true;
        payable(deal.buyer).transfer(deal.amount);

        emit FundsRefunded(dealId, deal.buyer, deal.amount);
    }

    function resolveDispute(uint256 dealId, bool favorSeller) external onlyOwner dealExists(dealId) {
        Deal storage deal = deals[dealId];
        require(!deal.isReleased, "Funds already released.");
        require(!deal.isRefunded, "Funds already refunded.");

        if (favorSeller) {
            deal.isReleased = true;
            payable(deal.seller).transfer(deal.amount);
            emit DisputeResolved(dealId, "Funds released to seller.");
        } else {
            deal.isRefunded = true;
            payable(deal.buyer).transfer(deal.amount);
            emit DisputeResolved(dealId, "Funds refunded to buyer.");
        }
    }

    function getDealDetails(uint256 dealId) external view dealExists(dealId) returns (Deal memory) {
        return deals[dealId];
    }
}
