import ARAssetNFT from 0x4520a5a7b69ee3ac
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

access(all) contract CollaborationHub {

    access(all) event ProjectCreated(id: UInt64, creator: Address, name: String)
    access(all) event CollaboratorAdded(projectId: UInt64, collaborator: Address, role: String)
    access(all) event CollaboratorRemoved(projectId: UInt64, collaborator: Address)
    access(all) event ContributionRecorded(projectId: UInt64, contributor: Address, contributionType: String)
    access(all) event RevenueShared(projectId: UInt64, amount: UFix64, recipients: [Address])
    access(all) event ProjectCompleted(projectId: UInt64, completedAt: UFix64)

    access(all) let ProjectStoragePath: StoragePath
    access(all) let ProjectPublicPath: PublicPath

    access(all) var totalProjects: UInt64

    access(all) enum Role: UInt8 {
        access(all) case owner
        access(all) case editor
        access(all) case contributor
        access(all) case viewer
    }

    access(all) enum ContributionType: UInt8 {
        access(all) case videoUpload
        access(all) case assetCreation
        access(all) case overlayDesign
        access(all) case editing
        access(all) case review
    }

    access(all) enum ProjectStatus: UInt8 {
        access(all) case active
        access(all) case completed
        access(all) case archived
    }

    access(all) struct CollaboratorInfo {
        access(all) let address: Address
        access(all) let role: Role
        access(all) let sharePercentage: UFix64
        access(all) var contributionCount: UInt64
        access(all) let joinedAt: UFix64

        init(address: Address, role: Role, sharePercentage: UFix64) {
            self.address = address
            self.role = role
            self.sharePercentage = sharePercentage
            self.contributionCount = 0
            self.joinedAt = getCurrentBlock().timestamp
        }

        access(all) fun incrementContributions() {
            self.contributionCount = self.contributionCount + 1
        }
    }

    access(all) struct Contribution {
        access(all) let contributor: Address
        access(all) let contributionType: ContributionType
        access(all) let description: String
        access(all) let timestamp: UFix64
        access(all) let metadata: {String: AnyStruct}

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

    access(all) resource Project {
        access(all) let id: UInt64
        access(all) let name: String
        access(all) let description: String
        access(all) let creator: Address
        access(all) var status: ProjectStatus
        access(all) let collaborators: {Address: CollaboratorInfo}
        access(all) let contributions: [Contribution]
        access(all) let assetIds: [UInt64]
        access(all) var totalRevenue: UFix64
        access(all) let createdAt: UFix64
        access(all) var completedAt: UFix64?

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

            self.collaborators[creator] = CollaboratorInfo(
                address: creator,
                role: Role.owner,
                sharePercentage: 100.0
            )
        }

        access(all) fun addCollaborator(
            address: Address,
            role: Role,
            sharePercentage: UFix64
        ) {
            pre {
                self.status == ProjectStatus.active: "Project is not active"
                self.collaborators[address] == nil: "Collaborator already exists"
                sharePercentage >= 0.0 && sharePercentage <= 100.0: "Invalid share percentage"
            }

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

        access(all) fun removeCollaborator(address: Address) {
            pre {
                self.collaborators[address] != nil: "Collaborator does not exist"
                address != self.creator: "Cannot remove project creator"
            }

            self.collaborators.remove(key: address)
            emit CollaboratorRemoved(projectId: self.id, collaborator: address)
        }

        access(all) fun recordContribution(
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

        access(all) fun addAsset(assetId: UInt64) {
            pre {
                self.status == ProjectStatus.active: "Project is not active"
            }
            self.assetIds.append(assetId)
        }

        access(all) fun distributeRevenue(amount: UFix64, vault: @{FungibleToken.Vault}) {
            pre {
                vault.balance == amount: "Vault balance does not match amount"
            }

            let recipients: [Address] = []

            for collaboratorAddress in self.collaborators.keys {
                let collaborator = self.collaborators[collaboratorAddress]!
                let share = amount * (collaborator.sharePercentage / 100.0)

                if share > 0.0 {
                    recipients.append(collaboratorAddress)
                }
            }

            self.totalRevenue = self.totalRevenue + amount
            emit RevenueShared(projectId: self.id, amount: amount, recipients: recipients)

            destroy vault
        }

        access(all) fun complete() {
            pre {
                self.status == ProjectStatus.active: "Project is not active"
            }

            self.status = ProjectStatus.completed
            self.completedAt = getCurrentBlock().timestamp
            emit ProjectCompleted(projectId: self.id, completedAt: getCurrentBlock().timestamp)
        }

        access(all) fun getTotalSharePercentage(): UFix64 {
            var total: UFix64 = 0.0
            for collaborator in self.collaborators.values {
                total = total + collaborator.sharePercentage
            }
            return total
        }

        access(all) fun isCollaborator(address: Address): Bool {
            return self.collaborators[address] != nil
        }

        access(all) fun getCollaboratorRole(address: Address): Role? {
            return self.collaborators[address]?.role
        }

        access(all) fun getStats(): {String: AnyStruct} {
            return {
                "totalCollaborators": self.collaborators.length,
                "totalContributions": self.contributions.length,
                "totalAssets": self.assetIds.length,
                "totalRevenue": self.totalRevenue,
                "status": self.status.rawValue
            }
        }
    }

    access(all) resource interface ProjectManagerPublic {
        access(all) fun getProjectIDs(): [UInt64]
        access(all) fun borrowProject(id: UInt64): &Project?
    }

    access(all) resource ProjectManager: ProjectManagerPublic {
        access(all) let ownerAddress: Address
        access(all) var projects: @{UInt64: Project}

        init(ownerAddress: Address) {
            self.ownerAddress = ownerAddress
            self.projects <- {}
        }

        access(all) fun createProject(
            name: String,
            description: String
        ): UInt64 {
            let project <- create Project(
                id: CollaborationHub.totalProjects,
                name: name,
                description: description,
                creator: self.ownerAddress
            )

            let id = project.id
            emit ProjectCreated(id: id, creator: self.ownerAddress, name: name)

            self.projects[id] <-! project
            CollaborationHub.totalProjects = CollaborationHub.totalProjects + 1

            return id
        }

        access(all) fun getProjectIDs(): [UInt64] {
            return self.projects.keys
        }

        access(all) fun borrowProject(id: UInt64): &Project? {
            return &self.projects[id] as &Project?
        }

        access(all) fun getProjectsByCollaborator(address: Address): [UInt64] {
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
    }

    access(all) fun createProjectManager(ownerAddress: Address): @ProjectManager {
        return <- create ProjectManager(ownerAddress: ownerAddress)
    }

    init() {
        self.totalProjects = 0
        self.ProjectStoragePath = /storage/CollaborationProjectManager
        self.ProjectPublicPath = /public/CollaborationProjectManager

        let manager <- create ProjectManager(ownerAddress: self.account.address)
        self.account.storage.save(<-manager, to: self.ProjectStoragePath)

        let managerCap = self.account.capabilities.storage.issue<&{ProjectManagerPublic}>(self.ProjectStoragePath)
        self.account.capabilities.publish(managerCap, at: self.ProjectPublicPath)
    }
}
