// ARAssetNFT.cdc
// MagicLens AR Asset NFT Contract
// 
// This contract defines NFTs for AR overlays (GIF, PNG, MP4)
// with metadata, licensing, and royalty support

import NonFungibleToken from 0x1d7e57aa55817448
import MetadataViews from 0x1d7e57aa55817448

pub contract ARAssetNFT: NonFungibleToken {

    // Events
    pub event ContractInitialized()
    pub event Withdraw(id: UInt64, from: Address?)
    pub event Deposit(id: UInt64, to: Address?)
    pub event Minted(id: UInt64, creator: Address, name: String, category: String)
    pub event AssetUsed(id: UInt64, usedBy: Address)
    pub event RoyaltyPaid(id: UInt64, amount: UFix64, recipient: Address)

    // Named Paths
    pub let CollectionStoragePath: StoragePath
    pub let CollectionPublicPath: PublicPath
    pub let MinterStoragePath: StoragePath

    // Total supply of AR Asset NFTs
    pub var totalSupply: UInt64

    // Asset Categories
    pub enum Category: UInt8 {
        pub case creatures
        pub case effects
        pub case objects
        pub case text
        pub case decorations
    }

    // License Types
    pub enum LicenseType: UInt8 {
        pub case personal      // Free for personal use
        pub case commercial    // Requires payment for commercial use
        pub case exclusive     // One-time exclusive license
    }

    // AR Asset Metadata
    pub struct AssetMetadata {
        pub let name: String
        pub let description: String
        pub let category: Category
        pub let assetType: String  // "gif", "png", "mp4"
        pub let fileURL: String
        pub let thumbnailURL: String?
        pub let fileSize: UInt64
        pub let dimensions: {String: UInt32}  // width, height
        pub let duration: UFix64?  // for video/gif in seconds
        pub let tags: [String]
        pub let licenseType: LicenseType
        pub let royaltyPercentage: UFix64  // 0.0 to 100.0
        pub let creator: Address
        pub let createdAt: UFix64
        pub var usageCount: UInt64

        init(
            name: String,
            description: String,
            category: Category,
            assetType: String,
            fileURL: String,
            thumbnailURL: String?,
            fileSize: UInt64,
            dimensions: {String: UInt32},
            duration: UFix64?,
            tags: [String],
            licenseType: LicenseType,
            royaltyPercentage: UFix64,
            creator: Address
        ) {
            self.name = name
            self.description = description
            self.category = category
            self.assetType = assetType
            self.fileURL = fileURL
            self.thumbnailURL = thumbnailURL
            self.fileSize = fileSize
            self.dimensions = dimensions
            self.duration = duration
            self.tags = tags
            self.licenseType = licenseType
            self.royaltyPercentage = royaltyPercentage
            self.creator = creator
            self.createdAt = getCurrentBlock().timestamp
            self.usageCount = 0
        }

        pub fun incrementUsage() {
            self.usageCount = self.usageCount + 1
        }
    }

    // NFT Resource
    pub resource NFT: NonFungibleToken.INFT, MetadataViews.Resolver {
        pub let id: UInt64
        pub let metadata: AssetMetadata

        init(
            id: UInt64,
            metadata: AssetMetadata
        ) {
            self.id = id
            self.metadata = metadata
        }

        pub fun getViews(): [Type] {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.Royalties>(),
                Type<MetadataViews.NFTCollectionData>(),
                Type<MetadataViews.NFTCollectionDisplay>(),
                Type<MetadataViews.ExternalURL>(),
                Type<MetadataViews.Traits>()
            ]
        }

        pub fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: self.metadata.name,
                        description: self.metadata.description,
                        thumbnail: MetadataViews.HTTPFile(url: self.metadata.thumbnailURL ?? self.metadata.fileURL)
                    )
                
                case Type<MetadataViews.Royalties>():
                    let royalties: [MetadataViews.Royalty] = []
                    if self.metadata.royaltyPercentage > 0.0 {
                        royalties.append(
                            MetadataViews.Royalty(
                                receiver: getAccount(self.metadata.creator).getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver),
                                cut: self.metadata.royaltyPercentage / 100.0,
                                description: "Creator royalty"
                            )
                        )
                    }
                    return MetadataViews.Royalties(royalties)
                
                case Type<MetadataViews.ExternalURL>():
                    return MetadataViews.ExternalURL("https://magiclens.app/asset/".concat(self.id.toString()))
                
                case Type<MetadataViews.NFTCollectionData>():
                    return MetadataViews.NFTCollectionData(
                        storagePath: ARAssetNFT.CollectionStoragePath,
                        publicPath: ARAssetNFT.CollectionPublicPath,
                        providerPath: /private/ARAssetNFTCollection,
                        publicCollection: Type<&ARAssetNFT.Collection{ARAssetNFT.CollectionPublic}>(),
                        publicLinkedType: Type<&ARAssetNFT.Collection{ARAssetNFT.CollectionPublic, NonFungibleToken.CollectionPublic, NonFungibleToken.Receiver, MetadataViews.ResolverCollection}>(),
                        providerLinkedType: Type<&ARAssetNFT.Collection{ARAssetNFT.CollectionPublic, NonFungibleToken.CollectionPublic, NonFungibleToken.Provider, MetadataViews.ResolverCollection}>(),
                        createEmptyCollectionFunction: (fun (): @NonFungibleToken.Collection {
                            return <-ARAssetNFT.createEmptyCollection()
                        })
                    )
                
                case Type<MetadataViews.Traits>():
                    let traits: [MetadataViews.Trait] = []
                    traits.append(MetadataViews.Trait(name: "category", value: self.metadata.category, displayType: "String", rarity: nil))
                    traits.append(MetadataViews.Trait(name: "assetType", value: self.metadata.assetType, displayType: "String", rarity: nil))
                    traits.append(MetadataViews.Trait(name: "usageCount", value: self.metadata.usageCount, displayType: "Number", rarity: nil))
                    traits.append(MetadataViews.Trait(name: "licenseType", value: self.metadata.licenseType, displayType: "String", rarity: nil))
                    return MetadataViews.Traits(traits)
            }
            return nil
        }
    }

    // Collection Interfaces
    pub resource interface CollectionPublic {
        pub fun deposit(token: @NonFungibleToken.NFT)
        pub fun getIDs(): [UInt64]
        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT
        pub fun borrowARAsset(id: UInt64): &ARAssetNFT.NFT? {
            post {
                (result == nil) || (result?.id == id):
                    "Cannot borrow AR Asset reference: The ID of the returned reference is incorrect"
            }
        }
    }

    // Collection Resource
    pub resource Collection: CollectionPublic, NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic, MetadataViews.ResolverCollection {
        pub var ownedNFTs: @{UInt64: NonFungibleToken.NFT}

        init() {
            self.ownedNFTs <- {}
        }

        pub fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")
            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }

        pub fun deposit(token: @NonFungibleToken.NFT) {
            let token <- token as! @ARAssetNFT.NFT
            let id: UInt64 = token.id
            let oldToken <- self.ownedNFTs[id] <- token
            emit Deposit(id: id, to: self.owner?.address)
            destroy oldToken
        }

        pub fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT {
            return (&self.ownedNFTs[id] as &NonFungibleToken.NFT?)!
        }

        pub fun borrowARAsset(id: UInt64): &ARAssetNFT.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = (&self.ownedNFTs[id] as auth &NonFungibleToken.NFT?)!
                return ref as! &ARAssetNFT.NFT
            }
            return nil
        }

        pub fun borrowViewResolver(id: UInt64): &AnyResource{MetadataViews.Resolver} {
            let nft = (&self.ownedNFTs[id] as auth &NonFungibleToken.NFT?)!
            let arAsset = nft as! &ARAssetNFT.NFT
            return arAsset as &AnyResource{MetadataViews.Resolver}
        }

        destroy() {
            destroy self.ownedNFTs
        }
    }

    // Public function to create empty collection
    pub fun createEmptyCollection(): @NonFungibleToken.Collection {
        return <- create Collection()
    }

    // Minter Resource
    pub resource NFTMinter {
        pub fun mintNFT(
            recipient: &{NonFungibleToken.CollectionPublic},
            name: String,
            description: String,
            category: Category,
            assetType: String,
            fileURL: String,
            thumbnailURL: String?,
            fileSize: UInt64,
            dimensions: {String: UInt32},
            duration: UFix64?,
            tags: [String],
            licenseType: LicenseType,
            royaltyPercentage: UFix64,
            creator: Address
        ): UInt64 {
            let metadata = AssetMetadata(
                name: name,
                description: description,
                category: category,
                assetType: assetType,
                fileURL: fileURL,
                thumbnailURL: thumbnailURL,
                fileSize: fileSize,
                dimensions: dimensions,
                duration: duration,
                tags: tags,
                licenseType: licenseType,
                royaltyPercentage: royaltyPercentage,
                creator: creator
            )

            let newNFT <- create NFT(
                id: ARAssetNFT.totalSupply,
                metadata: metadata
            )

            let id = newNFT.id
            emit Minted(id: id, creator: creator, name: name, category: category)

            recipient.deposit(token: <-newNFT)
            ARAssetNFT.totalSupply = ARAssetNFT.totalSupply + 1

            return id
        }
    }

    // Contract initialization
    init() {
        self.totalSupply = 0

        self.CollectionStoragePath = /storage/ARAssetNFTCollection
        self.CollectionPublicPath = /public/ARAssetNFTCollection
        self.MinterStoragePath = /storage/ARAssetNFTMinter

        // Create a Collection for the deployer
        let collection <- create Collection()
        self.account.save(<-collection, to: self.CollectionStoragePath)

        // Create a public capability for the collection
        self.account.link<&ARAssetNFT.Collection{NonFungibleToken.CollectionPublic, ARAssetNFT.CollectionPublic, MetadataViews.ResolverCollection}>(
            self.CollectionPublicPath,
            target: self.CollectionStoragePath
        )

        // Create a Minter resource and save it to storage
        let minter <- create NFTMinter()
        self.account.save(<-minter, to: self.MinterStoragePath)

        emit ContractInitialized()
    }
}