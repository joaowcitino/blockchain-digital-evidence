#!/usr/bin/env python3
"""
Role management script for Digital Evidence contract

Usage:
    # Grant role
    python scripts/manage_roles.py grant 0xADDRESS police

    # Revoke role
    python scripts/manage_roles.py revoke 0xADDRESS police

    # Check role
    python scripts/manage_roles.py check 0xADDRESS police
"""

import json
import os
import sys
from pathlib import Path
from web3 import Web3
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Role definitions
ROLES = {
    'admin': 1,
    'police': 2,
    'lab': 4,
    'judge': 8,
}

def load_contract():
    """Load contract instance"""
    rpc_url = os.getenv('BLOCKCHAIN_RPC_URL', 'http://127.0.0.1:8545')
    contract_address = os.getenv('CONTRACT_ADDRESS')
    private_key = os.getenv('PRIVATE_KEY')

    if not contract_address:
        print("❌ Error: CONTRACT_ADDRESS not found")
        sys.exit(1)

    if not private_key:
        print("❌ Error: PRIVATE_KEY not found")
        sys.exit(1)

    # Connect
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    if not w3.is_connected():
        print("❌ Error: Could not connect to blockchain")
        sys.exit(1)

    # Load ABI
    abi_path = Path(__file__).parent.parent / 'backend' / 'src' / 'config' / 'contractABI.json'
    with open(abi_path, 'r') as f:
        abi = json.load(f)

    # Account
    account = w3.eth.account.from_key(private_key)

    # Contract
    contract = w3.eth.contract(address=contract_address, abi=abi)

    return w3, contract, account

def grant_role(address, role_name):
    """Grant role to address"""
    if role_name not in ROLES:
        print(f"❌ Invalid role: {role_name}")
        print(f"   Available roles: {', '.join(ROLES.keys())}")
        sys.exit(1)

    role_value = ROLES[role_name]

    print(f"🔐 Granting {role_name.upper()} role to {address}")

    w3, contract, account = load_contract()

    # Build transaction
    tx = contract.functions.grant_role(address, role_value).build_transaction({
        'from': account.address,
        'nonce': w3.eth.get_transaction_count(account.address),
        'gas': 200000,
        'gasPrice': w3.eth.gas_price,
    })

    # Sign and send
    signed_tx = w3.eth.account.sign_transaction(tx, account.key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)

    print(f"⏳ Transaction sent: {tx_hash.hex()}")

    # Wait for receipt
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    if receipt.status == 1:
        print(f"✅ Role granted successfully!")
    else:
        print(f"❌ Transaction failed")

def revoke_role(address, role_name):
    """Revoke role from address"""
    if role_name not in ROLES:
        print(f"❌ Invalid role: {role_name}")
        print(f"   Available roles: {', '.join(ROLES.keys())}")
        sys.exit(1)

    role_value = ROLES[role_name]

    print(f"🔓 Revoking {role_name.upper()} role from {address}")

    w3, contract, account = load_contract()

    # Build transaction
    tx = contract.functions.revoke_role(address, role_value).build_transaction({
        'from': account.address,
        'nonce': w3.eth.get_transaction_count(account.address),
        'gas': 200000,
        'gasPrice': w3.eth.gas_price,
    })

    # Sign and send
    signed_tx = w3.eth.account.sign_transaction(tx, account.key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)

    print(f"⏳ Transaction sent: {tx_hash.hex()}")

    # Wait for receipt
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    if receipt.status == 1:
        print(f"✅ Role revoked successfully!")
    else:
        print(f"❌ Transaction failed")

def check_role(address, role_name):
    """Check if address has role"""
    if role_name not in ROLES:
        print(f"❌ Invalid role: {role_name}")
        print(f"   Available roles: {', '.join(ROLES.keys())}")
        sys.exit(1)

    role_value = ROLES[role_name]

    w3, contract, account = load_contract()

    has_role = contract.functions.has_role(address, role_value).call()

    if has_role:
        print(f"✅ {address} HAS {role_name.upper()} role")
    else:
        print(f"❌ {address} does NOT have {role_name.upper()} role")

def check_all_roles(address):
    """Check all roles for address"""
    w3, contract, account = load_contract()

    roles_bitmap = contract.functions.roles(address).call()

    print(f"\n📋 Roles for {address}:")
    print(f"   Raw bitmap: {roles_bitmap}")
    print("\n   Active roles:")

    has_any = False
    for role_name, role_value in ROLES.items():
        if roles_bitmap & role_value:
            print(f"   ✅ {role_name.upper()}")
            has_any = True

    if not has_any:
        print(f"   ❌ No roles assigned")

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  Grant role:   python scripts/manage_roles.py grant 0xADDRESS police")
        print("  Revoke role:  python scripts/manage_roles.py revoke 0xADDRESS police")
        print("  Check role:   python scripts/manage_roles.py check 0xADDRESS police")
        print("  Check all:    python scripts/manage_roles.py check 0xADDRESS")
        print("\nAvailable roles: admin, police, lab, judge")
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == 'grant':
        if len(sys.argv) != 4:
            print("Usage: python scripts/manage_roles.py grant 0xADDRESS role")
            sys.exit(1)
        grant_role(sys.argv[2], sys.argv[3].lower())

    elif command == 'revoke':
        if len(sys.argv) != 4:
            print("Usage: python scripts/manage_roles.py revoke 0xADDRESS role")
            sys.exit(1)
        revoke_role(sys.argv[2], sys.argv[3].lower())

    elif command == 'check':
        if len(sys.argv) == 3:
            check_all_roles(sys.argv[2])
        elif len(sys.argv) == 4:
            check_role(sys.argv[2], sys.argv[3].lower())
        else:
            print("Usage: python scripts/manage_roles.py check 0xADDRESS [role]")
            sys.exit(1)

    else:
        print(f"❌ Unknown command: {command}")
        print("Available commands: grant, revoke, check")
        sys.exit(1)

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
