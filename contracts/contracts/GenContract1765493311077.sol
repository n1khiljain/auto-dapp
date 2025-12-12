pragma solidity ^0.8.20;

contract GeneratedContract1765493311077 {
    uint256 public storedNumber;

    function storeNumber(uint256 _number) public {
        storedNumber = _number;
    }

    function retrieveNumber() public view returns (uint256) {
        return storedNumber;
    }
}