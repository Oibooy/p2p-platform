// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MTTEscrow is ReentrancyGuard {
    IERC20 public immutable token;
    address public immutable owner;
    uint256 private constant DENOMINATOR = 10000;
    uint256 public commissionRate = 100; // 1% (basis points)
    address public commissionWallet;

    struct Deal {
        address seller;
        address buyer;
        uint256 amount;
        uint256 commission;
        uint256 deadline;
        bool isReleased;
        bool isRefunded;
        bool isConfirmed;
    }

    mapping(uint256 => Deal) public deals;
    uint256 public dealCount;

    event DealCreated(uint256 indexed dealId, address indexed seller, uint256 amount, uint256 commission, uint256 deadline);
    event PaymentConfirmed(uint256 indexed dealId, address indexed buyer);
    event FundsReleased(uint256 indexed dealId, address indexed buyer, uint256 amount);
    event FundsRefunded(uint256 indexed dealId, address indexed seller, uint256 amount);
    event CommissionPaid(uint256 indexed dealId, address indexed wallet, uint256 amount);
    event CommissionRateUpdated(uint256 newRate);

    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized");
        _;
    }

    constructor(address _token, address _commissionWallet) {
        token = IERC20(_token);
        owner = msg.sender;
        commissionWallet = _commissionWallet;
    }

    function setCommissionRate(uint256 newRate) external onlyOwner {
        require(newRate <= 500, "Commission too high"); // Максимум 5%
        commissionRate = newRate;
        emit CommissionRateUpdated(newRate);
    }

    function lockFunds(uint256 amount, uint256 deadline) external nonReentrant {
        require(amount > 0, "Amount must be greater than zero");
        require(deadline > block.timestamp, "Invalid deadline");

        uint256 commission = (amount * commissionRate) / DENOMINATOR;
        uint256 totalAmount = amount + commission; // Блокируем MTT + комиссия

        token.transferFrom(msg.sender, address(this), totalAmount);
        deals[dealCount] = Deal(msg.sender, address(0), amount, commission, deadline, false, false, false);
        dealCount++;

        emit DealCreated(dealCount, msg.sender, amount, commission, deadline);
    }

    function confirmPayment(uint256 dealId, address buyer) external onlyOwner nonReentrant {
        Deal storage deal = deals[dealId];
        require(!deal.isReleased, "Funds already released");
        require(!deal.isConfirmed, "Payment already confirmed");

        deal.isConfirmed = true;
        deal.buyer = buyer;
        emit PaymentConfirmed(dealId, buyer);
    }

    function releaseFunds(uint256 dealId) external nonReentrant {
        Deal storage deal = deals[dealId];
        require(msg.sender == deal.seller, "Only seller can release funds");
        require(!deal.isReleased, "Funds already released");
        require(deal.isConfirmed, "Payment not confirmed yet");

        deal.isReleased = true;
        token.transfer(commissionWallet, deal.commission);
        token.transfer(deal.buyer, deal.amount);

        emit FundsReleased(dealId, deal.buyer, deal.amount);
        emit CommissionPaid(dealId, commissionWallet, deal.commission);
    }

    function cancelDeal(uint256 dealId) external nonReentrant {
        Deal storage deal = deals[dealId];
        require(msg.sender == deal.seller, "Only seller can cancel");
        require(!deal.isReleased, "Funds already released");
        require(!deal.isConfirmed, "Payment already confirmed");

        deal.isRefunded = true;
        uint256 refundAmount = deal.amount + deal.commission; // Полный возврат средств продавцу
        token.transfer(deal.seller, refundAmount);
        emit FundsRefunded(dealId, deal.seller, refundAmount);
    }
}