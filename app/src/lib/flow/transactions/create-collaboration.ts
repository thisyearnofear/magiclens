// Transaction to create a collaboration project
export const createCollaborationTransaction = `
import CollaborationHub from 0xCollaborationHub

transaction(name: String, description: String) {
    let projectManager: &CollaborationHub.ProjectManager

    prepare(signer: AuthAccount) {
        // Check if project manager exists, if not create it
        if signer.borrow<&CollaborationHub.ProjectManager>(from: CollaborationHub.ProjectStoragePath) == nil {
            let manager <- CollaborationHub.createProjectManager()
            signer.save(<-manager, to: CollaborationHub.ProjectStoragePath)
            
            signer.link<&CollaborationHub.ProjectManager{CollaborationHub.ProjectManagerPublic}>(
                CollaborationHub.ProjectPublicPath,
                target: CollaborationHub.ProjectStoragePath
            )
        }

        self.projectManager = signer.borrow<&CollaborationHub.ProjectManager>(from: CollaborationHub.ProjectStoragePath)
            ?? panic("Could not borrow project manager reference")
    }

    execute {
        let projectId = self.projectManager.createProject(
            name: name,
            description: description
        )
    }
}
`;