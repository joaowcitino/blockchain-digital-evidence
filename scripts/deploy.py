#!/usr/bin/env python3
"""
Deploy script for Digital Evidence smart contract

Requirements:
    pip install vyper web3 python-dotenv

Usage:
    python scripts/deploy.py
"""

import json
import os
from pathlib import Path
from web3 import Web3
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def compile_contract(contract_path):
    """
    Compile Vyper contract using vyper command
    Returns ABI and bytecode
    """
    print(f"📝 Compiling contract: {contract_path}")

    # Compile contract
    import subprocess

    # Get ABI
    abi_output = subprocess.check_output(['vyper', '-f', 'abi', '--evm-version', 'istanbul', contract_path])
    abi = json.loads(abi_output)

    # Get bytecode
    bytecode_output = subprocess.check_output(['vyper', '-f', 'bytecode', '--evm-version', 'istanbul', contract_path])
    bytecode = bytecode_output.decode('utf-8').strip()

    print("✅ Contract compiled successfully")
    return abi, bytecode

def deploy_contract():
    """
    Deploy the Digital Evidence smart contract
    """
    print("\n" + "="*60)
    print("🚀 Digital Evidence Contract Deployment")
    print("="*60 + "\n")

    # Configuration
    rpc_url = os.getenv('BLOCKCHAIN_RPC_URL', 'http://127.0.0.1:8545')
    private_key = os.getenv('PRIVATE_KEY')

    if not private_key:
        print("❌ Error: PRIVATE_KEY not found in environment variables")
        print("   Please set PRIVATE_KEY in .env file")
        return

    # Connect to blockchain
    print(f"🔗 Connecting to: {rpc_url}")
    w3 = Web3(Web3.HTTPProvider(rpc_url))

    if not w3.is_connected():
        print("❌ Error: Could not connect to blockchain")
        return

    print(f"✅ Connected to network (Chain ID: {w3.eth.chain_id})")

    # Load account
    account = w3.eth.account.from_key(private_key)
    print(f"📍 Deployer address: {account.address}")

    balance = w3.eth.get_balance(account.address)
    print(f"💰 Balance: {w3.from_wei(balance, 'ether')} ETH")

    if balance == 0:
        print("⚠️  Warning: Account balance is 0. Deployment may fail.")

    # Compile contract
    contract_path = Path(__file__).parent.parent / 'contracts' / 'DigitalEvidence.vy'
    abi, bytecode = compile_contract(contract_path)

    # Create contract instance
    Contract = w3.eth.contract(abi=abi, bytecode=bytecode)

    # Build transaction
    print("\n📦 Building deployment transaction...")

    nonce = w3.eth.get_transaction_count(account.address)

    # Estimate gas
    gas_estimate = Contract.constructor().estimate_gas({
        'from': account.address
    })

    print(f"⛽ Estimated gas: {gas_estimate}")

    # Build transaction
    transaction = Contract.constructor().build_transaction({
        'from': account.address,
        'nonce': nonce,
        'gas': int(gas_estimate * 1.2),  # Add 20% buffer
        'gasPrice': w3.eth.gas_price,
    })

    # Sign transaction
    print("✍️  Signing transaction...")
    signed_txn = w3.eth.account.sign_transaction(transaction, private_key)

    # Send transaction
    print("📤 Sending transaction...")
    tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
    print(f"⏳ Transaction hash: {tx_hash.hex()}")

    # Wait for confirmation
    print("⏳ Waiting for confirmation...")
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    if tx_receipt.status == 1:
        print("\n" + "="*60)
        print("✅ CONTRACT DEPLOYED SUCCESSFULLY!")
        print("="*60)
        print(f"\n📍 Contract Address: {tx_receipt.contractAddress}")
        print(f"🧾 Transaction Hash: {tx_hash.hex()}")
        print(f"⛽ Gas Used: {tx_receipt.gasUsed}")
        print(f"📦 Block Number: {tx_receipt.blockNumber}")

        # Save contract address to .env file
        print("\n💾 Saving contract address to backend/.env...")
        env_path = Path(__file__).parent.parent / 'backend' / '.env'

        # Read existing .env or create new
        env_lines = []
        if env_path.exists():
            with open(env_path, 'r') as f:
                env_lines = f.readlines()

        # Update or add CONTRACT_ADDRESS
        found = False
        for i, line in enumerate(env_lines):
            if line.startswith('CONTRACT_ADDRESS='):
                env_lines[i] = f'CONTRACT_ADDRESS={tx_receipt.contractAddress}\n'
                found = True
                break

        if not found:
            env_lines.append(f'CONTRACT_ADDRESS={tx_receipt.contractAddress}\n')

        with open(env_path, 'w') as f:
            f.writelines(env_lines)

        print("✅ Contract address saved to backend/.env")

        # Save ABI to backend
        print("\n💾 Saving ABI to backend/src/config/contractABI.json...")
        abi_path = Path(__file__).parent.parent / 'backend' / 'src' / 'config' / 'contractABI.json'
        with open(abi_path, 'w') as f:
            json.dump(abi, f, indent=2)
        print("✅ ABI saved")

        print("\n🎉 Deployment complete!")
        print("\nNext steps:")
        print("  1. Grant roles to addresses: contract.grant_role(address, role)")
        print("  2. Start IPFS daemon: ipfs daemon")
        print("  3. Start backend: cd backend && npm start")
        print("  4. Start frontend: cd frontend && npm start")

    else:
        print("\n❌ Deployment failed!")
        print(f"Transaction receipt: {tx_receipt}")

if __name__ == '__main__':
    try:
        deploy_contract()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
