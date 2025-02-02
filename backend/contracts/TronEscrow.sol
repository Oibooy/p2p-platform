// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITRC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
}

contract TronEscrow {
    ITRC20 public immutable usdtToken;
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

    event DealCreated(uint256 indexed dealId, address indexed buyer, address indexed seller, uint256 amount, uint256 deadline);
    event FundsReleased(uint256 indexed dealId, address indexed seller, uint256 amount);
    event FundsRefunded(uint256 indexed dealId, address indexed buyer, uint256 amount);
    event DisputeResolved(uint256 indexed dealId, string resolution);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor(address _usdtToken, address _commissionWallet) {
        usdtToken = ITRC20(_usdtToken);
        owner = msg.sender;
        commissionWallet = _commissionWallet;
    }

    function createDeal(address _seller, uint256 _amount, uint256 _deadline) external returns (uint256) {
        require(_deadline > block.timestamp, "Invalid deadline");
        require(usdtToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

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

    function releaseFunds(uint256 dealId) external {
        Deal storage deal = deals[dealId];
        require(msg.sender == deal.buyer || msg.sender == owner, "Unauthorized");
        require(!deal.isReleased && !deal.isRefunded, "Funds already processed");
        require(block.timestamp <= deal.deadline, "Deadline exceeded");

        deal.isReleased = true;
        uint256 commission = (deal.amount * commissionRate) / DENOMINATOR;
        uint256 sellerAmount = deal.amount - commission;

        require(usdtToken.transfer(commissionWallet, commission), "Commission transfer failed");
        require(usdtToken.transfer(deal.seller, sellerAmount), "Seller transfer failed");

        emit FundsReleased(dealId, deal.seller, sellerAmount);
    }

    function refundFunds(uint256 dealId) external {
        Deal storage deal = deals[dealId];
        require(msg.sender == deal.buyer || msg.sender == owner, "Unauthorized");
        require(!deal.isReleased && !deal.isRefunded, "Funds already processed");
        require(block.timestamp > deal.deadline, "Deadline not exceeded");

        deal.isRefunded = true;
        require(usdtToken.transfer(deal.buyer, deal.amount), "Refund transfer failed");

        emit FundsRefunded(dealId, deal.buyer, deal.amount);
    }

    function setCommissionRate(uint256 _rate) external onlyOwner {
        require(_rate <= 1000, "Commission too high"); // Max 10%
        commissionRate = _rate;
    }
}

