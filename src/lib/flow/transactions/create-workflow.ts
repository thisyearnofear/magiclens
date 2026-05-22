// Transaction to create a Forte workflow
export const createWorkflowTransaction = `
import ForteAutomation from 0xForteAutomation

transaction(
    workflowType: UInt8,
    triggerType: UInt8,
    actions: [UInt8],
    schedule: UFix64?,
    contentId: String?,
    assetId: UInt64?,
    amount: UFix64?,
    recipient: Address?
) {
    let workflowManager: &ForteAutomation.WorkflowManager

    prepare(signer: AuthAccount) {
        // Check if workflow manager exists, if not create it
        if signer.borrow<&ForteAutomation.WorkflowManager>(from: ForteAutomation.WorkflowStoragePath) == nil {
            let manager <- ForteAutomation.createWorkflowManager()
            signer.save(<-manager, to: ForteAutomation.WorkflowStoragePath)
            
            signer.link<&ForteAutomation.WorkflowManager{ForteAutomation.WorkflowManagerPublic}>(
                ForteAutomation.WorkflowPublicPath,
                target: ForteAutomation.WorkflowStoragePath
            )
        }

        self.workflowManager = signer.borrow<&ForteAutomation.WorkflowManager>(from: ForteAutomation.WorkflowStoragePath)
            ?? panic("Could not borrow workflow manager reference")
    }

    execute {
        let workflowTypeEnum = ForteAutomation.WorkflowType(rawValue: workflowType)!
        let triggerTypeEnum = ForteAutomation.TriggerType(rawValue: triggerType)!
        
        let actionEnums: [ForteAutomation.ActionType] = []
        for action in actions {
            actionEnums.append(ForteAutomation.ActionType(rawValue: action)!)
        }

        let conditions: {String: AnyStruct} = {}
        let parameters: {String: AnyStruct} = {}

        if contentId != nil {
            parameters["contentId"] = contentId!
        }
        if assetId != nil {
            parameters["assetId"] = assetId!
        }
        if amount != nil {
            parameters["amount"] = amount!
        }
        if recipient != nil {
            parameters["recipient"] = recipient!
        }

        let workflowId = self.workflowManager.createWorkflow(
            workflowType: workflowTypeEnum,
            triggerType: triggerTypeEnum,
            actions: actionEnums,
            schedule: schedule,
            conditions: conditions,
            parameters: parameters
        )
    }
}
`;