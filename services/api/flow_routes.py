"""API routes for Flow blockchain integration."""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from core.flow_service import flow_service
from core.access import authenticated
from core.user import User

router = APIRouter(prefix="/flow", tags=["flow"])


class NFTOwnershipRequest(BaseModel):
    """Request to verify NFT ownership."""
    wallet_address: str
    nft_id: int


class NFTUsageRequest(BaseModel):
    """Request to increment NFT usage."""
    nft_id: int


class WorkflowExecutionRequest(BaseModel):
    """Request to execute a workflow."""
    workflow_id: int


class RoyaltyDistributionRequest(BaseModel):
    """Request to distribute royalties."""
    nft_id: int
    amount: float


class ContractAddressUpdate(BaseModel):
    """Update contract address after deployment."""
    contract_name: str
    address: str


@router.get("/health")
async def health_check():
    """Health check endpoint for Flow service."""
    return {
        "status": "healthy",
        "network": flow_service.network,
        "contracts": flow_service.contract_addresses
    }


@router.post("/verify-nft-ownership")
async def verify_nft_ownership(request: NFTOwnershipRequest):
    """
    Verify that a wallet owns a specific NFT.
    
    Args:
        request: NFT ownership verification request
        
    Returns:
        Ownership verification result
    """
    try:
        owns_nft = await flow_service.verify_nft_ownership(
            request.wallet_address,
            request.nft_id
        )
        return {
            "wallet_address": request.wallet_address,
            "nft_id": request.nft_id,
            "owns_nft": owns_nft
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nft/{nft_id}")
async def get_nft_metadata(nft_id: int):
    """
    Get metadata for a specific NFT.
    
    Args:
        nft_id: NFT ID
        
    Returns:
        NFT metadata
    """
    try:
        metadata = await flow_service.get_nft_metadata(nft_id)
        if not metadata:
            raise HTTPException(status_code=404, detail="NFT not found")
        return metadata
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/nft/increment-usage")
@authenticated
async def increment_nft_usage(request: NFTUsageRequest, user: User):
    """
    Increment usage count for an NFT.
    
    Args:
        request: NFT usage increment request
        user: Authenticated user
        
    Returns:
        Success status
    """
    try:
        success = await flow_service.increment_nft_usage(
            request.nft_id,
            user.wallet_address
        )
        if not success:
            raise HTTPException(status_code=500, detail="Failed to increment usage")
        return {"success": True, "nft_id": request.nft_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/workflows/{wallet_address}")
async def get_user_workflows(wallet_address: str):
    """
    Get all workflows for a user.
    
    Args:
        wallet_address: Flow wallet address
        
    Returns:
        List of workflows
    """
    try:
        workflows = await flow_service.get_user_workflows(wallet_address)
        return {"wallet_address": wallet_address, "workflows": workflows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/workflow/execute")
@authenticated
async def execute_workflow(request: WorkflowExecutionRequest, user: User):
    """
    Execute a workflow.
    
    Args:
        request: Workflow execution request
        user: Authenticated user
        
    Returns:
        Execution result
    """
    try:
        success = await flow_service.execute_workflow(
            request.workflow_id,
            user.wallet_address
        )
        if not success:
            raise HTTPException(status_code=500, detail="Failed to execute workflow")
        return {"success": True, "workflow_id": request.workflow_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/project/{project_id}")
async def get_collaboration_project(project_id: int):
    """
    Get collaboration project details from blockchain.
    
    Args:
        project_id: Project ID
        
    Returns:
        Project details
    """
    try:
        project = await flow_service.get_collaboration_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return project
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/royalties/distribute")
@authenticated
async def distribute_royalties(request: RoyaltyDistributionRequest, user: User):
    """
    Distribute royalties to NFT creator.
    
    Args:
        request: Royalty distribution request
        user: Authenticated user
        
    Returns:
        Distribution result
    """
    try:
        success = await flow_service.distribute_royalties(
            request.nft_id,
            request.amount,
            user.wallet_address
        )
        if not success:
            raise HTTPException(status_code=500, detail="Failed to distribute royalties")
        return {
            "success": True,
            "nft_id": request.nft_id,
            "amount": request.amount
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/nft/sync/{nft_id}")
@authenticated
async def sync_nft_to_database(nft_id: int, user: User):
    """
    Sync NFT data from blockchain to local database.
    
    Args:
        nft_id: NFT ID on blockchain
        user: Authenticated user
        
    Returns:
        Sync result with database asset ID
    """
    try:
        asset_id = await flow_service.sync_nft_to_database(
            nft_id,
            user.wallet_address
        )
        if not asset_id:
            raise HTTPException(status_code=500, detail="Failed to sync NFT")
        return {
            "success": True,
            "nft_id": nft_id,
            "asset_id": str(asset_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/set-contract-address")
async def set_contract_address(update: ContractAddressUpdate):
    """
    Set contract address after deployment (admin only).
    
    Args:
        update: Contract address update
        
    Returns:
        Success status
    """
    try:
        flow_service.set_contract_address(
            update.contract_name,
            update.address
        )
        return {
            "success": True,
            "contract_name": update.contract_name,
            "address": update.address
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/contracts")
async def get_contract_addresses():
    """
    Get all deployed contract addresses.
    
    Returns:
        Contract addresses
    """
    return {
        "network": flow_service.network,
        "contracts": flow_service.contract_addresses
    }