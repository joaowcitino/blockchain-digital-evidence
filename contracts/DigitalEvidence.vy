# @version ^0.3.7
"""
@title Digital Evidence Management System
@author Blockchain & Digital Evidence Course Project
@notice This contract manages digital evidence with chain of custody, RBAC, and integrity verification
@dev Implements advanced mechanisms: custody tracking, FSM for status, multiple file attachments per evidence
"""

# ============================================================================
# INTERFACES AND EVENTS
# ============================================================================

event EvidenceRegistered:
    id: indexed(uint256)
    file_hash: bytes32
    ipfs_cid: String[100]
    case_id: String[50]
    creator: indexed(address)
    timestamp: uint256

event CustodyTransferred:
    id: indexed(uint256)
    from_address: indexed(address)
    to_address: indexed(address)
    reason: String[200]
    timestamp: uint256

event StatusChanged:
    id: indexed(uint256)
    old_status: uint256
    new_status: uint256
    changed_by: indexed(address)
    timestamp: uint256

event EvidenceFileAdded:
    id: indexed(uint256)
    file_hash: bytes32
    ipfs_cid: String[100]
    file_type: String[50]
    added_by: indexed(address)
    timestamp: uint256

event RoleGranted:
    account: indexed(address)
    role: uint256
    granted_by: indexed(address)

event RoleRevoked:
    account: indexed(address)
    role: uint256
    revoked_by: indexed(address)

# ============================================================================
# ENUMS AND CONSTANTS
# ============================================================================

# Evidence Status FSM
# Collected -> InAnalysis -> Archived
# Collected -> Invalidated (terminal)
enum Status:
    Collected      # 0 - Initial state
    InAnalysis     # 1 - Being analyzed
    Archived       # 2 - Analysis complete, archived
    Invalidated    # 3 - Invalid evidence (terminal)

# Role definitions
ROLE_ADMIN: constant(uint256) = 1
ROLE_POLICE: constant(uint256) = 2
ROLE_LAB: constant(uint256) = 4
ROLE_JUDGE: constant(uint256) = 8

# ============================================================================
# STRUCTS
# ============================================================================

struct Evidence:
    id: uint256
    file_hash: bytes32
    ipfs_cid: String[100]
    description: String[500]
    case_id: String[50]
    creator: address
    current_custodian: address
    created_at: uint256
    status: Status
    exists: bool

struct CustodyEvent:
    from_address: address
    to_address: address
    timestamp: uint256
    reason: String[200]

struct EvidenceFile:
    file_hash: bytes32
    ipfs_cid: String[100]
    file_type: String[50]
    added_by: address
    added_at: uint256

# ============================================================================
# STATE VARIABLES
# ============================================================================

# Admin address
admin: public(address)

# Evidence counter
evidence_counter: public(uint256)

# Evidence storage: evidence_id => Evidence
evidences: public(HashMap[uint256, Evidence])

# Chain of custody: evidence_id => array of custody events
custody_history: HashMap[uint256, DynArray[CustodyEvent, 1000]]

# Additional files per evidence: evidence_id => array of files
evidence_files: HashMap[uint256, DynArray[EvidenceFile, 100]]

# Role-based access control: address => roles bitmap
roles: public(HashMap[address, uint256])

# Prevent duplicate evidence registration: file_hash => bool
registered_hashes: HashMap[bytes32, bool]

# ============================================================================
# MODIFIERS (via internal functions)
# ============================================================================

@internal
@view
def _only_admin():
    """@dev Validates caller is admin"""
    assert msg.sender == self.admin, "Only admin"

@internal
@view
def _only_role(required_role: uint256):
    """@dev Validates caller has required role"""
    assert self.roles[msg.sender] & required_role != 0, "Unauthorized role"

@internal
@view
def _evidence_exists(evidence_id: uint256):
    """@dev Validates evidence exists"""
    assert self.evidences[evidence_id].exists, "Evidence does not exist"

@internal
@view
def _only_custodian(evidence_id: uint256):
    """@dev Validates caller is current custodian"""
    assert self.evidences[evidence_id].current_custodian == msg.sender, "Not custodian"

@internal
@view
def _validate_address(addr: address):
    """@dev Validates address is not zero"""
    assert addr != empty(address), "Invalid address"

@internal
@view
def _validate_string(s: String[500]):
    """@dev Validates string is not empty"""
    assert len(s) > 0, "Empty string"

@internal
@view
def _validate_case_id(case_id: String[50]):
    """@dev Validates case ID is not empty"""
    assert len(case_id) > 0, "Empty case ID"

@internal
@view
def _validate_hash(hash: bytes32):
    """@dev Validates hash is not zero"""
    assert hash != empty(bytes32), "Invalid hash"

# ============================================================================
# CONSTRUCTOR
# ============================================================================

@external
def __init__():
    """
    @notice Initializes the contract
    @dev Sets deployer as admin with all roles
    """
    self.admin = msg.sender
    self.evidence_counter = 0
    # Grant admin all roles
    self.roles[msg.sender] = ROLE_ADMIN | ROLE_POLICE | ROLE_LAB | ROLE_JUDGE

# ============================================================================
# RBAC FUNCTIONS
# ============================================================================

@external
def grant_role(account: address, role: uint256):
    """
    @notice Grants a role to an account
    @dev Only admin can grant roles
    @param account The address to grant role to
    @param role The role bitmap to grant
    """
    self._only_admin()
    self._validate_address(account)
    assert role in [ROLE_ADMIN, ROLE_POLICE, ROLE_LAB, ROLE_JUDGE], "Invalid role"

    self.roles[account] = self.roles[account] | role
    log RoleGranted(account, role, msg.sender)

@external
def revoke_role(account: address, role: uint256):
    """
    @notice Revokes a role from an account
    @dev Only admin can revoke roles
    @param account The address to revoke role from
    @param role The role bitmap to revoke
    """
    self._only_admin()
    self._validate_address(account)
    assert role in [ROLE_ADMIN, ROLE_POLICE, ROLE_LAB, ROLE_JUDGE], "Invalid role"

    self.roles[account] = self.roles[account] & ~role
    log RoleRevoked(account, role, msg.sender)

@external
@view
def has_role(account: address, role: uint256) -> bool:
    """
    @notice Checks if an account has a specific role
    @param account The address to check
    @param role The role to check for
    @return True if account has role
    """
    return (self.roles[account] & role) != 0

# ============================================================================
# EVIDENCE REGISTRATION
# ============================================================================

@external
def register_evidence(
    file_hash: bytes32,
    ipfs_cid: String[100],
    description: String[500],
    case_id: String[50]
) -> uint256:
    """
    @notice Registers new digital evidence
    @dev Only POLICE can register. Creates initial custody record.
    @param file_hash SHA-256 hash of the evidence file
    @param ipfs_cid IPFS Content Identifier
    @param description Evidence description
    @param case_id Associated case identifier
    @return The evidence ID
    """
    # Security validations
    self._only_role(ROLE_POLICE)
    self._validate_hash(file_hash)
    self._validate_string(description)
    self._validate_case_id(case_id)
    assert len(ipfs_cid) > 0, "Empty IPFS CID"

    # Prevent duplicate registration
    assert not self.registered_hashes[file_hash], "Evidence already registered"

    # Create evidence
    self.evidence_counter += 1
    evidence_id: uint256 = self.evidence_counter

    self.evidences[evidence_id] = Evidence({
        id: evidence_id,
        file_hash: file_hash,
        ipfs_cid: ipfs_cid,
        description: description,
        case_id: case_id,
        creator: msg.sender,
        current_custodian: msg.sender,
        created_at: block.timestamp,
        status: Status.Collected,
        exists: True
    })

    # Mark hash as registered
    self.registered_hashes[file_hash] = True

    # Create initial custody record
    initial_custody: CustodyEvent = CustodyEvent({
        from_address: empty(address),
        to_address: msg.sender,
        timestamp: block.timestamp,
        reason: "Initial registration"
    })
    self.custody_history[evidence_id].append(initial_custody)

    log EvidenceRegistered(evidence_id, file_hash, ipfs_cid, case_id, msg.sender, block.timestamp)

    return evidence_id

# ============================================================================
# CUSTODY MANAGEMENT
# ============================================================================

@external
def transfer_custody(evidence_id: uint256, new_custodian: address, reason: String[200]):
    """
    @notice Transfers custody of evidence to another address
    @dev Only current custodian can transfer. New custodian must have a role.
    @param evidence_id The evidence ID
    @param new_custodian The address to transfer custody to
    @param reason Reason for transfer
    """
    # Security validations
    self._evidence_exists(evidence_id)
    self._only_custodian(evidence_id)
    self._validate_address(new_custodian)
    assert len(reason) > 0, "Empty reason"

    # New custodian must have at least one role
    assert self.roles[new_custodian] != 0, "New custodian has no role"

    # Cannot transfer to self
    assert new_custodian != msg.sender, "Cannot transfer to self"

    # Record custody transfer
    old_custodian: address = self.evidences[evidence_id].current_custodian

    custody_event: CustodyEvent = CustodyEvent({
        from_address: old_custodian,
        to_address: new_custodian,
        timestamp: block.timestamp,
        reason: reason
    })
    self.custody_history[evidence_id].append(custody_event)

    # Update custodian
    self.evidences[evidence_id].current_custodian = new_custodian

    log CustodyTransferred(evidence_id, old_custodian, new_custodian, reason, block.timestamp)

@external
@view
def get_custody_history(evidence_id: uint256) -> DynArray[CustodyEvent, 1000]:
    """
    @notice Gets the complete custody history for an evidence
    @param evidence_id The evidence ID
    @return Array of custody events
    """
    self._evidence_exists(evidence_id)
    return self.custody_history[evidence_id]

@external
@view
def get_current_custodian(evidence_id: uint256) -> address:
    """
    @notice Gets the current custodian of an evidence
    @param evidence_id The evidence ID
    @return Current custodian address
    """
    self._evidence_exists(evidence_id)
    return self.evidences[evidence_id].current_custodian

# ============================================================================
# STATUS MANAGEMENT (FINITE STATE MACHINE)
# ============================================================================

@external
def set_status(evidence_id: uint256, new_status: Status):
    """
    @notice Changes evidence status following FSM rules
    @dev Only LAB or JUDGE can change status. Enforces valid transitions.
    @param evidence_id The evidence ID
    @param new_status The new status

    Valid transitions:
    - Collected -> InAnalysis (LAB)
    - Collected -> Invalidated (JUDGE)
    - InAnalysis -> Archived (LAB/JUDGE)
    - InAnalysis -> Invalidated (JUDGE)
    """
    # Security validations
    self._evidence_exists(evidence_id)
    self._only_role(ROLE_LAB | ROLE_JUDGE)

    old_status: Status = self.evidences[evidence_id].status

    # Cannot set same status
    assert new_status != old_status, "Status unchanged"

    # Validate FSM transitions
    if old_status == Status.Collected:
        assert new_status == Status.InAnalysis or new_status == Status.Invalidated, "Invalid transition from Collected"
    elif old_status == Status.InAnalysis:
        assert new_status == Status.Archived or new_status == Status.Invalidated, "Invalid transition from InAnalysis"
    elif old_status == Status.Archived:
        raise "Cannot transition from Archived"
    elif old_status == Status.Invalidated:
        raise "Cannot transition from Invalidated"

    # Update status
    self.evidences[evidence_id].status = new_status

    log StatusChanged(evidence_id, convert(old_status, uint256), convert(new_status, uint256), msg.sender, block.timestamp)

# ============================================================================
# ADVANCED FEATURE: MULTIPLE FILES PER EVIDENCE
# ============================================================================

@external
def add_file_to_evidence(
    evidence_id: uint256,
    file_hash: bytes32,
    ipfs_cid: String[100],
    file_type: String[50]
):
    """
    @notice Adds an additional file to existing evidence (e.g., lab reports, analysis results)
    @dev Only LAB can add files. Advanced mechanism for complex evidence.
    @param evidence_id The evidence ID
    @param file_hash Hash of the additional file
    @param ipfs_cid IPFS CID of the additional file
    @param file_type Type/description of file (e.g., "Lab Report", "Hash Analysis")
    """
    # Security validations
    self._evidence_exists(evidence_id)
    self._only_role(ROLE_LAB)
    self._validate_hash(file_hash)
    assert len(ipfs_cid) > 0, "Empty IPFS CID"
    assert len(file_type) > 0, "Empty file type"

    # Create file record
    evidence_file: EvidenceFile = EvidenceFile({
        file_hash: file_hash,
        ipfs_cid: ipfs_cid,
        file_type: file_type,
        added_by: msg.sender,
        added_at: block.timestamp
    })

    self.evidence_files[evidence_id].append(evidence_file)

    log EvidenceFileAdded(evidence_id, file_hash, ipfs_cid, file_type, msg.sender, block.timestamp)

@external
@view
def get_evidence_files(evidence_id: uint256) -> DynArray[EvidenceFile, 100]:
    """
    @notice Gets all additional files for an evidence
    @param evidence_id The evidence ID
    @return Array of evidence files
    """
    self._evidence_exists(evidence_id)
    return self.evidence_files[evidence_id]

# ============================================================================
# QUERY FUNCTIONS
# ============================================================================

@external
@view
def get_evidence(evidence_id: uint256) -> Evidence:
    """
    @notice Gets complete evidence details
    @param evidence_id The evidence ID
    @return Evidence struct
    """
    self._evidence_exists(evidence_id)
    return self.evidences[evidence_id]

@external
@view
def get_evidence_count() -> uint256:
    """
    @notice Gets total number of registered evidences
    @return Evidence count
    """
    return self.evidence_counter

@external
@view
def verify_integrity(evidence_id: uint256, file_hash: bytes32) -> bool:
    """
    @notice Verifies evidence file integrity by comparing hashes
    @param evidence_id The evidence ID
    @param file_hash Hash to verify against
    @return True if hash matches
    """
    self._evidence_exists(evidence_id)
    return self.evidences[evidence_id].file_hash == file_hash
