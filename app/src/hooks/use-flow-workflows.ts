// Hook for managing Flow Forte workflows
import { useState, useEffect, useCallback } from 'react';
import { fcl } from '../lib/flow/fcl-config';
import * as t from '@onflow/types';
import { getUserWorkflowsScript } from '../lib/flow/scripts/get-user-workflows';
import { createWorkflowTransaction } from '../lib/flow/transactions/create-workflow';

export interface FlowWorkflow {
  id: number;
  workflowType: number;
  triggerType: number;
  isActive: boolean;
  executionCount: number;
  schedule?: number;
  lastExecuted?: number;
  createdAt: number;
}

export interface CreateWorkflowParams {
  workflowType: number;
  triggerType: number;
  actions: number[];
  schedule?: number;
  contentId?: string;
  assetId?: number;
  amount?: number;
  recipient?: string;
}

// Workflow type enums
export const WorkflowType = {
  SCHEDULED_PUBLISHING: 0,
  ROYALTY_DISTRIBUTION: 1,
  COLLABORATION_NOTIFICATION: 2,
  CONTENT_MODERATION: 3,
} as const;

// Trigger type enums
export const TriggerType = {
  TIME_BASED: 0,
  EVENT_BASED: 1,
  CONDITION_BASED: 2,
} as const;

// Action type enums
export const ActionType = {
  MINT_AR_ASSET: 0,
  APPLY_OVERLAY: 1,
  SHARE_REVENUE: 2,
  LICENSE_ASSET: 3,
  NOTIFY_COLLABORATORS: 4,
  PUBLISH_CONTENT: 5,
} as const;

export function useFlowWorkflows(userAddress: string | null) {
  const [workflows, setWorkflows] = useState<FlowWorkflow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    if (!userAddress) {
      setWorkflows([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fcl.query({
        cadence: getUserWorkflowsScript,
        args: (arg, t) => [arg(userAddress, t.Address)],
      });

      setWorkflows(result || []);
    } catch (err) {
      console.error('Error fetching workflows:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch workflows');
      setWorkflows([]);
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const createWorkflow = useCallback(async (params: CreateWorkflowParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const transactionId = await fcl.mutate({
        cadence: createWorkflowTransaction,
        args: (arg, t) => [
          arg(params.workflowType, t.UInt8),
          arg(params.triggerType, t.UInt8),
          arg(params.actions, t.Array(t.UInt8)),
          arg(params.schedule?.toString() || null, t.Optional(t.UFix64)),
          arg(params.contentId || null, t.Optional(t.String)),
          arg(params.assetId?.toString() || null, t.Optional(t.UInt64)),
          arg(params.amount?.toFixed(2) || null, t.Optional(t.UFix64)),
          arg(params.recipient || null, t.Optional(t.Address)),
        ],
        limit: 999,
      });

      const result = await fcl.tx(transactionId).onceSealed();
      console.log('Workflow created successfully:', result);
      
      // Refresh workflows after creation
      await fetchWorkflows();
      
      return result;
    } catch (err) {
      console.error('Error creating workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to create workflow');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchWorkflows]);

  // Helper function to create scheduled publishing workflow
  const createScheduledPublishing = useCallback(async (contentId: string, publishTime: Date) => {
    return createWorkflow({
      workflowType: WorkflowType.SCHEDULED_PUBLISHING,
      triggerType: TriggerType.TIME_BASED,
      actions: [ActionType.PUBLISH_CONTENT, ActionType.NOTIFY_COLLABORATORS],
      schedule: publishTime.getTime() / 1000, // Convert to Unix timestamp
      contentId,
    });
  }, [createWorkflow]);

  // Helper function to create royalty distribution workflow
  const createRoyaltyDistribution = useCallback(async (
    assetId: number,
    amount: number,
    recipient: string
  ) => {
    return createWorkflow({
      workflowType: WorkflowType.ROYALTY_DISTRIBUTION,
      triggerType: TriggerType.EVENT_BASED,
      actions: [ActionType.SHARE_REVENUE],
      assetId,
      amount,
      recipient,
    });
  }, [createWorkflow]);

  return {
    workflows,
    isLoading,
    error,
    fetchWorkflows,
    createWorkflow,
    createScheduledPublishing,
    createRoyaltyDistribution,
    WorkflowType,
    TriggerType,
    ActionType,
  };
}