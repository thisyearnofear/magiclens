import ARAssetNFT from 0x4520a5a7b69ee3ac
import FungibleToken from 0x9a0766d93b6608b7

access(all) contract ForteAutomation {

    access(all) event WorkflowCreated(id: UInt64, creator: Address, workflowType: String)
    access(all) event WorkflowExecuted(id: UInt64, timestamp: UFix64)
    access(all) event ActionTriggered(actionType: String, triggeredBy: Address)
    access(all) event RoyaltyDistributed(assetId: UInt64, amount: UFix64, recipient: Address)
    access(all) event ContentPublished(contentId: String, publishedAt: UFix64)

    access(all) let WorkflowStoragePath: StoragePath
    access(all) let WorkflowPublicPath: PublicPath

    access(all) var totalWorkflows: UInt64

    access(all) enum WorkflowType: UInt8 {
        access(all) case scheduledPublishing
        access(all) case royaltyDistribution
        access(all) case collaborationNotification
        access(all) case contentModeration
    }

    access(all) enum ActionType: UInt8 {
        access(all) case mintARAsset
        access(all) case applyOverlay
        access(all) case shareRevenue
        access(all) case licenseAsset
        access(all) case notifyCollaborators
        access(all) case publishContent
    }

    access(all) enum TriggerType: UInt8 {
        access(all) case timeBased
        access(all) case eventBased
        access(all) case conditionBased
    }

    access(all) struct WorkflowConfig {
        access(all) let workflowType: WorkflowType
        access(all) let triggerType: TriggerType
        access(all) let actions: [ActionType]
        access(all) let schedule: UFix64?
        access(all) let conditions: {String: AnyStruct}
        access(all) let parameters: {String: AnyStruct}
        access(all) var isActive: Bool
        access(all) var executionCount: UInt64
        access(all) let createdAt: UFix64

        init(
            workflowType: WorkflowType,
            triggerType: TriggerType,
            actions: [ActionType],
            schedule: UFix64?,
            conditions: {String: AnyStruct},
            parameters: {String: AnyStruct}
        ) {
            self.workflowType = workflowType
            self.triggerType = triggerType
            self.actions = actions
            self.schedule = schedule
            self.conditions = conditions
            self.parameters = parameters
            self.isActive = true
            self.executionCount = 0
            self.createdAt = getCurrentBlock().timestamp
        }

        access(all) fun incrementExecution() {
            self.executionCount = self.executionCount + 1
        }

        access(all) fun deactivate() {
            self.isActive = false
        }

        access(all) fun activate() {
            self.isActive = true
        }
    }

    access(all) resource Workflow {
        access(all) let id: UInt64
        access(all) let creator: Address
        access(all) let config: WorkflowConfig
        access(all) var lastExecuted: UFix64?

        init(
            id: UInt64,
            creator: Address,
            config: WorkflowConfig
        ) {
            self.id = id
            self.creator = creator
            self.config = config
            self.lastExecuted = nil
        }

        access(all) fun run(): Bool {
            if !self.config.isActive {
                return false
            }

            let shouldExecute = self.checkTrigger()
            if !shouldExecute {
                return false
            }

            for action in self.config.actions {
                self.executeAction(action)
            }

            self.config.incrementExecution()
            self.lastExecuted = getCurrentBlock().timestamp
            emit WorkflowExecuted(id: self.id, timestamp: getCurrentBlock().timestamp)

            return true
        }

        access(self) fun checkTrigger(): Bool {
            switch self.config.triggerType {
                case TriggerType.timeBased:
                    if let schedule = self.config.schedule {
                        return getCurrentBlock().timestamp >= schedule
                    }
                    return false

                case TriggerType.eventBased:
                    return true

                case TriggerType.conditionBased:
                    return self.evaluateConditions()
            }
            return false
        }

        access(self) fun evaluateConditions(): Bool {
            return self.config.conditions.length > 0
        }

        access(self) fun executeAction(_ actionType: ActionType) {
            emit ActionTriggered(actionType: actionType.rawValue.toString(), triggeredBy: self.creator)

            switch actionType {
                case ActionType.publishContent:
                    self.publishContent()
                case ActionType.shareRevenue:
                    self.distributeRoyalties()
                case ActionType.notifyCollaborators:
                    self.notifyCollaborators()
                default:
                    break
            }
        }

        access(self) fun publishContent() {
            if let contentId = self.config.parameters["contentId"] as? String {
                emit ContentPublished(contentId: contentId, publishedAt: getCurrentBlock().timestamp)
            }
        }

        access(self) fun distributeRoyalties() {
            if let assetId = self.config.parameters["assetId"] as? UInt64 {
                if let amount = self.config.parameters["amount"] as? UFix64 {
                    if let recipient = self.config.parameters["recipient"] as? Address {
                        emit RoyaltyDistributed(assetId: assetId, amount: amount, recipient: recipient)
                    }
                }
            }
        }

        access(self) fun notifyCollaborators() {
        }
    }

    access(all) resource interface WorkflowManagerPublic {
        access(all) fun getWorkflowIDs(): [UInt64]
        access(all) fun borrowWorkflow(id: UInt64): &Workflow?
    }

    access(all) resource WorkflowManager: WorkflowManagerPublic {
        access(all) let ownerAddress: Address
        access(all) var workflows: @{UInt64: Workflow}

        init(ownerAddress: Address) {
            self.ownerAddress = ownerAddress
            self.workflows <- {}
        }

        access(all) fun createWorkflow(
            workflowType: WorkflowType,
            triggerType: TriggerType,
            actions: [ActionType],
            schedule: UFix64?,
            conditions: {String: AnyStruct},
            parameters: {String: AnyStruct}
        ): UInt64 {
            let config = WorkflowConfig(
                workflowType: workflowType,
                triggerType: triggerType,
                actions: actions,
                schedule: schedule,
                conditions: conditions,
                parameters: parameters
            )

            let workflow <- create Workflow(
                id: ForteAutomation.totalWorkflows,
                creator: self.ownerAddress,
                config: config
            )

            let id = workflow.id
            emit WorkflowCreated(
                id: id,
                creator: self.ownerAddress,
                workflowType: workflowType.rawValue.toString()
            )

            self.workflows[id] <-! workflow
            ForteAutomation.totalWorkflows = ForteAutomation.totalWorkflows + 1

            return id
        }

        access(all) fun executeWorkflow(id: UInt64): Bool {
            if let workflow = &self.workflows[id] as &Workflow? {
                return workflow.run()
            }
            return false
        }

        access(all) fun getWorkflowIDs(): [UInt64] {
            return self.workflows.keys
        }

        access(all) fun borrowWorkflow(id: UInt64): &Workflow? {
            return &self.workflows[id] as &Workflow?
        }

        access(all) fun deactivateWorkflow(id: UInt64) {
            if let workflow = &self.workflows[id] as &Workflow? {
                workflow.config.deactivate()
            }
        }

        access(all) fun activateWorkflow(id: UInt64) {
            if let workflow = &self.workflows[id] as &Workflow? {
                workflow.config.activate()
            }
        }
    }

    access(all) fun createWorkflowManager(ownerAddress: Address): @WorkflowManager {
        return <- create WorkflowManager(ownerAddress: ownerAddress)
    }

    access(all) fun createScheduledPublishingWorkflow(
        manager: &WorkflowManager,
        contentId: String,
        publishTime: UFix64
    ): UInt64 {
        let parameters: {String: AnyStruct} = {
            "contentId": contentId
        }

        return manager.createWorkflow(
            workflowType: WorkflowType.scheduledPublishing,
            triggerType: TriggerType.timeBased,
            actions: [ActionType.publishContent, ActionType.notifyCollaborators],
            schedule: publishTime,
            conditions: {},
            parameters: parameters
        )
    }

    access(all) fun createRoyaltyDistributionWorkflow(
        manager: &WorkflowManager,
        assetId: UInt64,
        amount: UFix64,
        recipient: Address
    ): UInt64 {
        let parameters: {String: AnyStruct} = {
            "assetId": assetId,
            "amount": amount,
            "recipient": recipient
        }

        return manager.createWorkflow(
            workflowType: WorkflowType.royaltyDistribution,
            triggerType: TriggerType.eventBased,
            actions: [ActionType.shareRevenue],
            schedule: nil,
            conditions: {},
            parameters: parameters
        )
    }

    access(all) fun createCollaborationWorkflow(
        manager: &WorkflowManager,
        projectId: String,
        milestoneConditions: {String: AnyStruct}
    ): UInt64 {
        let parameters: {String: AnyStruct} = {
            "projectId": projectId
        }

        return manager.createWorkflow(
            workflowType: WorkflowType.collaborationNotification,
            triggerType: TriggerType.conditionBased,
            actions: [ActionType.notifyCollaborators],
            schedule: nil,
            conditions: milestoneConditions,
            parameters: parameters
        )
    }

    init() {
        self.totalWorkflows = 0
        self.WorkflowStoragePath = /storage/ForteWorkflowManager
        self.WorkflowPublicPath = /public/ForteWorkflowManager

        let manager <- create WorkflowManager(ownerAddress: self.account.address)
        self.account.storage.save(<-manager, to: self.WorkflowStoragePath)

        let workflowCap = self.account.capabilities.storage.issue<&{WorkflowManagerPublic}>(self.WorkflowStoragePath)
        self.account.capabilities.publish(workflowCap, at: self.WorkflowPublicPath)
    }
}
