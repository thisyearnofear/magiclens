// Script to get user's collaboration projects
export const getUserProjectsScript = `
import CollaborationHub from 0xCollaborationHub

pub struct ProjectData {
    pub let id: UInt64
    pub let name: String
    pub let description: String
    pub let creator: Address
    pub let status: UInt8
    pub let collaboratorCount: Int
    pub let contributionCount: Int
    pub let totalRevenue: UFix64
    pub let createdAt: UFix64

    init(
        id: UInt64,
        name: String,
        description: String,
        creator: Address,
        status: UInt8,
        collaboratorCount: Int,
        contributionCount: Int,
        totalRevenue: UFix64,
        createdAt: UFix64
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.creator = creator
        self.status = status
        self.collaboratorCount = collaboratorCount
        self.contributionCount = contributionCount
        self.totalRevenue = totalRevenue
        self.createdAt = createdAt
    }
}

pub fun main(address: Address): [ProjectData] {
    let account = getAccount(address)
    let manager = account.getCapability(CollaborationHub.ProjectPublicPath)
        .borrow<&CollaborationHub.ProjectManager{CollaborationHub.ProjectManagerPublic}>()
        ?? panic("Could not borrow project manager reference")

    let projectIds = manager.getProjectsByCollaborator(address: address)
    let projects: [ProjectData] = []

    for id in projectIds {
        if let project = manager.borrowProject(id: id) {
            let stats = project.getStats()
            
            projects.append(ProjectData(
                id: project.id,
                name: project.name,
                description: project.description,
                creator: project.creator,
                status: project.status.rawValue,
                collaboratorCount: stats["totalCollaborators"] as! Int,
                contributionCount: stats["totalContributions"] as! Int,
                totalRevenue: stats["totalRevenue"] as! UFix64,
                createdAt: project.createdAt
            ))
        }
    }

    return projects
}
`;