import { useState } from 'react';
import { useFlowAuth } from '../hooks/use-flow-auth';
import { useFlowWorkflows, WorkflowType, TriggerType, ActionType } from '../hooks/use-flow-workflows';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2, Plus, Calendar, Zap, CheckCircle2, Clock } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

const WORKFLOW_TYPE_NAMES = {
  [WorkflowType.SCHEDULED_PUBLISHING]: 'Scheduled Publishing',
  [WorkflowType.ROYALTY_DISTRIBUTION]: 'Royalty Distribution',
  [WorkflowType.COLLABORATION_NOTIFICATION]: 'Collaboration Notification',
  [WorkflowType.CONTENT_MODERATION]: 'Content Moderation',
};

const TRIGGER_TYPE_NAMES = {
  [TriggerType.TIME_BASED]: 'Time-Based',
  [TriggerType.EVENT_BASED]: 'Event-Based',
  [TriggerType.CONDITION_BASED]: 'Condition-Based',
};

export function FlowWorkflowManager() {
  const { walletAddress, isLoggedIn } = useFlowAuth();
  const { workflows, isLoading, error, createScheduledPublishing } = useFlowWorkflows(walletAddress);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [contentId, setContentId] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [publishTime, setPublishTime] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateWorkflow = async () => {
    if (!contentId || !publishDate || !publishTime) {
      alert('Please fill in all fields');
      return;
    }

    setIsCreating(true);
    try {
      const publishDateTime = new Date(`${publishDate}T${publishTime}`);
      await createScheduledPublishing(contentId, publishDateTime);
      
      // Reset form
      setContentId('');
      setPublishDate('');
      setPublishTime('');
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to create workflow:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (!isLoggedIn) {
    return (
      <Alert>
        <AlertDescription>
          Please connect your Flow wallet to manage workflows
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Flow Forte Workflows</h2>
          <p className="text-muted-foreground">Automate your AR content publishing and collaboration</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Scheduled Publishing Workflow</CardTitle>
            <CardDescription>
              Automatically publish your AR content at a specific time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contentId">Content ID</Label>
              <Input
                id="contentId"
                placeholder="Enter content ID"
                value={contentId}
                onChange={(e) => setContentId(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="publishDate">Publish Date</Label>
                <Input
                  id="publishDate"
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publishTime">Publish Time</Label>
                <Input
                  id="publishTime"
                  type="time"
                  value={publishTime}
                  onChange={(e) => setPublishTime(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateWorkflow} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Create Workflow
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {workflows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Workflows Yet</CardTitle>
            <CardDescription>
              Create your first automated workflow to schedule content publishing, distribute royalties, or notify collaborators
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {WORKFLOW_TYPE_NAMES[workflow.workflowType as keyof typeof WORKFLOW_TYPE_NAMES]}
                    </CardTitle>
                    <CardDescription>
                      {TRIGGER_TYPE_NAMES[workflow.triggerType as keyof typeof TRIGGER_TYPE_NAMES]}
                    </CardDescription>
                  </div>
                  <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                    {workflow.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Executions:
                  </span>
                  <Badge variant="outline">{workflow.executionCount}</Badge>
                </div>

                {workflow.schedule && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Scheduled:
                    </span>
                    <span className="text-xs">{formatDate(workflow.schedule)}</span>
                  </div>
                )}

                {workflow.lastExecuted && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last Run:
                    </span>
                    <span className="text-xs">{formatDate(workflow.lastExecuted)}</span>
                  </div>
                )}

                <div className="pt-2 border-t text-xs text-muted-foreground">
                  Created: {formatDate(workflow.createdAt)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}