// CollaborationHub.cdc
// Multi-party collaboration smart contracts for MagicLens
//
// Enables decentralized collaboration with revenue sharing,
// access control, and contribution tracking

import ARAssetNFT from "./ARAssetNFT.cdc"
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

pub contract CollaborationHub {

    // Events
    pub event ProjectCreated(id: UInt64, creator: Address, name: String)
    pub event CollaboratorAdded(projectId: UInt64, collaborator: Address, role: String)
    pub event CollaboratorRemoved(projectId: UInt64, collaborator: Address)
    pub event ContributionRecorded(projectId: UInt64, contributor: Address, contributionType: String)
    pub event RevenueShared(projectId: UInt64, amount: UFix64, recipients: [Address])
    pub event ProjectCompleted(projectId: UInt64, completedAt: UFix64)

    // Storage paths
    pub let ProjectStoragePath: StoragePath
    pub let ProjectPublicPath: PublicPath

    // Total projects created
    pub var totalProjects: UInt64

    // Collaborator Roles
    pub enum Role: UInt8 {
        pub case owner
        pub case editor
        pub case contributor
        pub case viewer
    }

    // Contribution Types
    pub enum ContributionType: UInt8 {
        pub case videoUpload
        pub case assetCreation
        pub case overlayDesign
        pub case editing
        pub case review
    }

    // Project Status
    pub enum ProjectStatus: UInt8 {
        pub case active
        pub case completed
        pub case archived
    }

    // Collaborator Info
    pub struct CollaboratorInfo {
        pub let address: Address
        pub let role: Role
        pub let sharePercentage: UFix64  // Revenue share (0.0 to 100.0)
        pub var contributionCount: UInt64
        pub let joinedAt: UFix64

        init(address: Address, role: Role, sharePercentage: UFix64) {
            self.address = address
            self.role = role
            self.sharePercentage = sharePercentage
            self.contributionCount = 0
            self.joinedAt = getCurrentBlock().timestamp
        }

        pub fun incrementContributions() {
            self.contributionCount = self.contributionCount + 1
        }
    }

    // Contribution Record
    pub struct Contribution {
        pub let contributor: Address
        pub let contributionType: ContributionType
        pub let description: String
        pub let timestamp: UFix64
        pub let metadata: {String: AnyStruct}

        init(
            contributor: Address,
            contributionType: ContributionType,
            description: String,
            metadata: {String: AnyStruct}
        ) {
            self.contributor = contributor
            self.contributionType = contributionType
            self.description = description
            self.timestamp = getCurrentBlock().timestamp
            self.metadata = metadata
        }
    }

    // Project Resource
    pub resource Project {
        pub let id: UInt64
        pub let name: String
        pub let description: String
        pub let creator: Address
        pub var status: ProjectStatus
        pub let collaborators: {Address: CollaboratorInfo}
        pub let contributions: [Contribution]
        pub let assetIds: [UInt64]  // AR Asset NFT IDs used in project
        pub var totalRevenue: UFix64
        pub let createdAt: UFix64
        pub var completedAt: UFix64?

        init(
            id: UInt64,
            name: String,
            description: String,
            creator: Address
        ) {
            self.id = id
            self.name = name
            self.description = description
            self.creator = creator
            self.status = ProjectStatus.active
            self.collaborators = {}
            self.contributions = []
            self.assetIds = []
            self.totalRevenue = 0.0
            self.createdAt = getCurrentBlock().timestamp
            self.completedAt = nil

            // Add creator as owner with 100% share initially
            self.collaborators[creator] = CollaboratorInfo(
                address: creator,
                role: Role.owner,
                sharePercentage: 100.0
            )
        }

        // Add collaborator to project
        pub fun addCollaborator(
            address: Address,
            role: Role,
            sharePercentage: UFix64
        ) {
            pre {
                self.status == ProjectStatus.active: "Project is not active"
                self.collaborators[address] == nil: "Collaborator already exists"
                sharePercentage >= 0.0 && sharePercentage <= 100.0: "Invalid share percentage"
            }

            // Adjust existing shares proportionally
            let totalExistingShare = self.getTotalSharePercentage()
            let remainingShare = 100.0 - totalExistingShare

            if sharePercentage > remainingShare {
                panic("Not enough share percentage available")
            }

            self.collaborators[address] = CollaboratorInfo(
                address: address,
                role: role,
                sharePercentage: sharePercentage
            )

            emit CollaboratorAdded(projectId: self.id, collaborator: address, role: role.rawValue.toString())
        }

        // Remove collaborator
        pub fun removeCollaborator(address: Address) {
            pre {
                self.collaborators[address] != nil: "Collaborator does not exist"
                address != self.creator: "Cannot remove project creator"
            }

            self.collaborators.remove(key: address)
            emit CollaboratorRemoved(projectId: self.id, collaborator: address)
        }

        // Record contribution
        pub fun recordContribution(
            contributor: Address,
            contributionType: ContributionType,
            description: String,
            metadata: {String: AnyStruct}
        ) {
            pre {
                self.collaborators[contributor] != nil: "Not a collaborator"
                self.status == ProjectStatus.active: "Project is not active"
            }

            let contribution = Contribution(
                contributor: contributor,
                contributionType: contributionType,
                description: description,
                metadata: metadata
            )

            self.contributions.append(contribution)
            self.collaborators[contributor]!.incrementContributions()

            emit ContributionRecorded(
                projectId: self.id,
                contributor: contributor,
                contributionType: contributionType.rawValue.toString()
            )
        }

        // Add AR asset to project
        pub fun addAsset(assetId: UInt64) {
            pre {
                self.status == ProjectStatus.active: "Project is not active"
            }
            self.assetIds.append(assetId)
        }

        // Distribute revenue to collaborators
        pub fun distributeRevenue(amount: UFix64, vault: @FungibleToken.Vault) {
            pre {
                vault.balance == amount: "Vault balance does not match amount"
            }

            let recipients: [Address] = []
            
            for collaboratorAddress in self.collaborators.keys {
                let collaborator = self.collaborators[collaboratorAddress]!
                let share = amount * (collaborator.sharePercentage / 100.0)
                
                if share > 0.0 {
                    // In production, this would transfer tokens to collaborator
                    // For hackathon, we emit events
                    recipients.append(collaboratorAddress)
                }
            }

            self.totalRevenue = self.totalRevenue + amount
            emit RevenueShared(projectId: self.id, amount: amount, recipients: recipients)

            // Destroy the vault (in production, distribute to collaborators)
            destroy vault
        }

        // Complete project
        pub fun complete() {
            pre {
                self.status == ProjectStatus.active: "Project is not active"
            }

            self.status = ProjectStatus.completed
            self.completedAt = getCurrentBlock().timestamp
            emit ProjectCompleted(projectId: self.id, completedAt: getCurrentBlock().timestamp)
        }

        // Get total share percentage
        pub fun getTotalSharePercentage(): UFix64 {
            var total: UFix64 = 0.0
            for collaborator in self.collaborators.values {
                total = total + collaborator.sharePercentage
            }
            return total
        }

        // Check if address is collaborator
        pub fun isCollaborator(address: Address): Bool {
            return self.collaborators[address] != nil
        }

        // Get collaborator role
        pub fun getCollaboratorRole(address: Address): Role? {
            return self.collaborators[address]?.role
        }

        // Get project statistics
        pub fun getStats(): {String: AnyStruct} {
            return {
                "totalCollaborators": self.collaborators.length,
                "totalContributions": self.contributions.length,
                "totalAssets": self.assetIds.length,
                "totalRevenue": self.totalRevenue,
                "status": self.status.rawValue
            }
        }
    }

    // Project Manager Interface
    pub resource interface ProjectManagerPublic {
        pub fun getProjectIDs(): [UInt64]
        pub fun borrowProject(id: UInt64): &Project?
    }

    // Project Manager Resource
    pub resource ProjectManager: ProjectManagerPublic {
        pub var projects: @{UInt64: Project}

        init() {
            self.projects <- {}
        }

        // Create new project
        pub fun createProject(
            name: String,
            description: String
        ): UInt64 {
            let project <- create Project(
                id: CollaborationHub.totalProjects,
                name: name,
                description: description,
                creator: self.owner!.address
            )

            let id = project.id
            emit ProjectCreated(id: id, creator: self.owner!.address, name: name)

            self.projects[id] <-! project
            CollaborationHub.totalProjects = CollaborationHub.totalProjects + 1

            return id
        }

        // Get all project IDs
        pub fun getProjectIDs(): [UInt64] {
            return self.projects.keys
        }

        // Borrow project reference
        pub fun borrowProject(id: UInt64): &Project? {
            return &self.projects[id] as &Project?
        }

        // Get projects by collaborator
        pub fun getProjectsByCollaborator(address: Address): [UInt64] {
            let projectIds: [UInt64] = []
            for id in self.projects.keys {
                if let project = &self.projects[id] as &Project? {
                    if project.isCollaborator(address: address) {
                        projectIds.append(id)
                    }
                }
            }
            return projectIds
        }

        destroy() {
            destroy self.projects
        }
    }

    // Create empty project manager
    pub fun createProjectManager(): @ProjectManager {
        return <- create ProjectManager()
    }

    init() {
        self.totalProjects = 0
        self.ProjectStoragePath = /storage/CollaborationProjectManager
        self.ProjectPublicPath = /public/CollaborationProjectManager

        // Create project manager for deployer
        let manager <- create ProjectManager()
        self.account.save(<-manager, to: self.ProjectStoragePath)

        // Create public capability
        self.account.link<&ProjectManager{ProjectManagerPublic}>(
            self.ProjectPublicPath,
            target: self.ProjectStoragePath
        )
    }
}