// Script to get user's Forte workflows
export const getUserWorkflowsScript = `
import ForteAutomation from 0xForteAutomation

pub struct WorkflowData {
    pub let id: UInt64
    pub let workflowType: UInt8
    pub let triggerType: UInt8
    pub let isActive: Bool
    pub let executionCount: UInt64
    pub let schedule: UFix64?
    pub let lastExecuted: UFix64?
    pub let createdAt: UFix64

    init(
        id: UInt64,
        workflowType: UInt8,
        triggerType: UInt8,
        isActive: Bool,
        executionCount: UInt64,
        schedule: UFix64?,
        lastExecuted: UFix64?,
        createdAt: UFix64
    ) {
        self.id = id
        self.workflowType = workflowType
        self.triggerType = triggerType
        self.isActive = isActive
        self.executionCount = executionCount
        self.schedule = schedule
        self.lastExecuted = lastExecuted
        self.createdAt = createdAt
    }
}

pub fun main(address: Address): [WorkflowData] {
    let account = getAccount(address)
    let manager = account.getCapability(ForteAutomation.WorkflowPublicPath)
        .borrow<&ForteAutomation.WorkflowManager{ForteAutomation.WorkflowManagerPublic}>()
        ?? panic("Could not borrow workflow manager reference")

    let workflowIds = manager.getWorkflowIDs()
    let workflows: [WorkflowData] = []

    for id in workflowIds {
        if let workflow = manager.borrowWorkflow(id: id) {
            workflows.append(WorkflowData(
                id: workflow.id,
                workflowType: workflow.config.workflowType.rawValue,
                triggerType: workflow.config.triggerType.rawValue,
                isActive: workflow.config.isActive,
                executionCount: workflow.config.executionCount,
                schedule: workflow.config.schedule,
                lastExecuted: workflow.lastExecuted,
                createdAt: workflow.config.createdAt
            ))
        }
    }

    return workflows
}
`;