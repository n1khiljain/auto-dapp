// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GeneratedContract1765657858073 {
    mapping(address => uint256) public dickCheeseBalance;
    uint256 public totalDickCheeseSupply;
    event DickCheeseMinted(address indexed owner, uint256 amount);
    event DickCheeseTransferred(address indexed from, address indexed to, uint256 amount);

    function mintDickCheese(uint256 _amount) external {
        require(_amount > 0, "Must mint more than 0 Dick Cheese");
        dickCheeseBalance[msg.sender] += _amount;
        totalDickCheeseSupply += _amount;
        emit DickCheeseMinted(msg.sender, _amount);
    }

    function transferDickCheese(address _to, uint256 _amount) external {
        require(_amount > 0, "Must transfer more than 0 Dick Cheese");
        require(dickCheeseBalance[msg.sender] >= _amount, "Insufficient Dick Cheese balance");
        dickCheeseBalance[msg.sender] -= _amount;
        dickCheeseBalance[_to] += _amount;
        emit DickCheeseTransferred(msg.sender, _to, _amount);
    }

    function getDickCheeseBalance(address _user) external view returns (uint256) {
        return dickCheeseBalance[_user];
    }

    function getTotalDickCheeseSupply() external view returns (uint256) {
        return totalDickCheeseSupply;
    }
}