// ARAssetNFT.cdc - Fixed for Cadence 1.0
// MagicLens AR Asset NFT Contract
// 
// This contract defines NFTs for AR overlays (GIF, PNG, MP4)
// with metadata, licensing, and royalty support

import NonFungibleToken from 0xf8d6e0586b0a20c7
import MetadataViews from 0xf8d6e0586b0a20c7
import ViewResolver from 0xf8d6e0586b0a20c7
import FungibleToken from 0xee82856bf20e2aa6

access(all) contract ARAssetNFT: NonFungibleToken {

    // Events
    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event Minted(id: UInt64, creator: Address, name: String, category: String)

    // Named Paths
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath

    // Total supply of AR Asset NFTs
    access(all) var totalSupply: UInt64

    // Asset Categories
    access(all) enum Category: UInt8 {
        access(all) case creatures
        access(all) case effects
        access(all) case objects
        access(all) case text
        access(all) case decorations
    }

    // License Types
    access(all) enum LicenseType: UInt8 {
        access(all) case personal      // Free for personal use
        access(all) case commercial    // Requires payment for commercial use
        access(all) case exclusive     // One-time exclusive license
    }

    // AR Asset Metadata
    access(all) struct AssetMetadata {
        access(all) let name: String
        access(all) let description: String
        access(all) let category: Category
        access(all) let assetType: String  // "gif", "png", "mp4"
        access(all) let fileURL: String
        access(all) let thumbnailURL: String?
        access(all) let creator: Address
        access(all) let createdAt: UFix64
        access(all) var usageCount: UInt64

        init(
            name: String,
            description: String,
            category: Category,
            assetType: String,
            fileURL: String,
            thumbnailURL: String?,
            creator: Address
        ) {
            self.name = name
            self.description = description
            self.category = category
            self.assetType = assetType
            self.fileURL = fileURL
            self.thumbnailURL = thumbnailURL
            self.creator = creator
            self.createdAt = getCurrentBlock().timestamp
            self.usageCount = 0
        }

        access(all) fun incrementUsage() {
            self.usageCount = self.usageCount + 1
        }
    }

    // NFT Resource
    access(all) resource NFT: NonFungibleToken.NFT, ViewResolver.Resolver {
        access(all) let id: UInt64
        access(all) let metadata: AssetMetadata

        init(
            id: UInt64,
            metadata: AssetMetadata
        ) {
            self.id = id
            self.metadata = metadata
        }

        access(all) view fun getViews(): [Type] {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.ExternalURL>(),
                Type<MetadataViews.NFTCollectionData>(),
                Type<MetadataViews.NFTCollectionDisplay>(),
                Type<MetadataViews.Traits>()
            ]
        }

        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: self.metadata.name,
                        description: self.metadata.description,
                        thumbnail: MetadataViews.HTTPFile(url: self.metadata.thumbnailURL ?? self.metadata.fileURL)
                    )
                
                case Type<MetadataViews.ExternalURL>():
                    return MetadataViews.ExternalURL("https://magiclens.app/asset/".concat(self.id.toString()))
                
                case Type<MetadataViews.NFTCollectionData>():
                    return MetadataViews.NFTCollectionData(
                        storagePath: ARAssetNFT.CollectionStoragePath,
                        publicPath: ARAssetNFT.CollectionPublicPath,
                        publicCollection: Type<&ARAssetNFT.Collection>(),
                        publicLinkedType: Type<&{CollectionPublic, NonFungibleToken.Collection, ViewResolver.ResolverCollection}>(),
                        createEmptyCollectionFunction: (fun (): @{NonFungibleToken.Collection} {
                            return <-ARAssetNFT.createEmptyCollection(nftType: Type<@ARAssetNFT.NFT>())
                        })
                    )
                
                case Type<MetadataViews.NFTCollectionDisplay>():
                    return MetadataViews.NFTCollectionDisplay(
                        name: "MagicLens AR Assets",
                        description: "AR overlays for videos - GIFs, images, and effects",
                        externalURL: MetadataViews.ExternalURL("https://magiclens.app"),
                        squareImage: MetadataViews.Media(
                            file: MetadataViews.HTTPFile(url: "https://magiclens.app/logo.png"),
                            mediaType: "image/png"
                        ),
                        bannerImage: MetadataViews.Media(
                            file: MetadataViews.HTTPFile(url: "https://magiclens.app/banner.png"),
                            mediaType: "image/png"
                        ),
                        socials: {
                            "twitter": MetadataViews.ExternalURL("https://twitter.com/magiclens")
                        }
                    )
                
                case Type<MetadataViews.Traits>():
                    let traits: [MetadataViews.Trait] = []
                    traits.append(MetadataViews.Trait(name: "category", value: self.metadata.category, displayType: "String", rarity: nil))
                    traits.append(MetadataViews.Trait(name: "assetType", value: self.metadata.assetType, displayType: "String", rarity: nil))
                    traits.append(MetadataViews.Trait(name: "usageCount", value: self.metadata.usageCount, displayType: "Number", rarity: nil))
                    return MetadataViews.Traits(traits)
            }
            return nil
        }

        // Required by NonFungibleToken.NFT
        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-ARAssetNFT.createEmptyCollection(nftType: Type<@ARAssetNFT.NFT>())
        }
    }

    // Collection Interfaces
    access(all) resource interface CollectionPublic {
        access(all) fun borrowARAsset(id: UInt64): &ARAssetNFT.NFT? {
            post {
                (result == nil) || (result?.id == id):
                    "Cannot borrow AR Asset reference: The ID of the returned reference is incorrect"
            }
        }
    }

    // Collection Resource
    access(all) resource Collection: NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.Collection, CollectionPublic, ViewResolver.ResolverCollection {
        access(all) var ownedNFTs: @{UInt64: {NonFungibleToken.NFT}}

        init() {
            self.ownedNFTs <- {}
        }

        access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT} {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")
            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }

        access(all) fun deposit(token: @{NonFungibleToken.NFT}) {
            let token <- token as! @ARAssetNFT.NFT
            let id: UInt64 = token.id
            let oldToken <- self.ownedNFTs[id] <- token
            emit Deposit(id: id, to: self.owner?.address)
            destroy oldToken
        }

        access(all) view fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}? {
            return &self.ownedNFTs[id]
        }

        access(all) fun borrowARAsset(id: UInt64): &ARAssetNFT.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as &{NonFungibleToken.NFT}?
                return ref as! &ARAssetNFT.NFT
            }
            return nil
        }

        access(all) view fun borrowViewResolver(id: UInt64): &{ViewResolver.Resolver}? {
            if let nft = &self.ownedNFTs[id] as &{NonFungibleToken.NFT}? {
                return nft as! &{ViewResolver.Resolver}
            }
            return nil
        }

        // Required by NonFungibleToken.Collection
        access(all) view fun getSupportedNFTTypes(): {Type: Bool} {
            return {Type<@ARAssetNFT.NFT>(): true}
        }

        access(all) view fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@ARAssetNFT.NFT>()
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-ARAssetNFT.createEmptyCollection(nftType: Type<@ARAssetNFT.NFT>())
        }
    }

    // Public function to create empty collection
    access(all) fun createEmptyCollection(nftType: Type): @{NonFungibleToken.Collection} {
        return <- create Collection()
    }

    // Required by NonFungibleToken contract
    access(all) view fun getContractViews(resourceType: Type?): [Type] {
        return [Type<MetadataViews.NFTCollectionData>(), Type<MetadataViews.NFTCollectionDisplay>()]
    }

    access(all) fun resolveContractView(resourceType: Type?, viewType: Type): AnyStruct? {
        switch viewType {
            case Type<MetadataViews.NFTCollectionData>():
                return MetadataViews.NFTCollectionData(
                    storagePath: self.CollectionStoragePath,
                    publicPath: self.CollectionPublicPath,
                    publicCollection: Type<&ARAssetNFT.Collection>(),
                    publicLinkedType: Type<&{CollectionPublic, NonFungibleToken.Collection, ViewResolver.ResolverCollection}>(),
                    createEmptyCollectionFunction: (fun (): @{NonFungibleToken.Collection} {
                        return <-ARAssetNFT.createEmptyCollection(nftType: Type<@ARAssetNFT.NFT>())
                    })
                )
            case Type<MetadataViews.NFTCollectionDisplay>():
                return MetadataViews.NFTCollectionDisplay(
                    name: "MagicLens AR Assets",
                    description: "AR overlays for videos - GIFs, images, and effects",
                    externalURL: MetadataViews.ExternalURL("https://magiclens.app"),
                    squareImage: MetadataViews.Media(
                        file: MetadataViews.HTTPFile(url: "https://magiclens.app/logo.png"),
                        mediaType: "image/png"
                    ),
                    bannerImage: MetadataViews.Media(
                        file: MetadataViews.HTTPFile(url: "https://magiclens.app/banner.png"),
                        mediaType: "image/png"
                    ),
                    socials: {
                        "twitter": MetadataViews.ExternalURL("https://twitter.com/magiclens")
                    }
                )
        }
        return nil
    }

    // Minter Resource (simplified)
    access(all) resource NFTMinter {
        access(all) fun mintNFT(
            recipient: &{NonFungibleToken.Receiver},
            name: String,
            description: String,
            category: Category,
            assetType: String,
            fileURL: String,
            thumbnailURL: String?,
            creator: Address
        ): UInt64 {
            let metadata = AssetMetadata(
                name: name,
                description: description,
                category: category,
                assetType: assetType,
                fileURL: fileURL,
                thumbnailURL: thumbnailURL,
                creator: creator
            )

            let newNFT <- create NFT(
                id: ARAssetNFT.totalSupply,
                metadata: metadata
            )

            let id = newNFT.id
            emit Minted(id: id, creator: creator, name: name, category: category.rawValue.toString())

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
        self.account.storage.save(<-collection, to: self.CollectionStoragePath)

        // Create a public capability for the collection
        let collectionCap = self.account.capabilities.storage.issue<&{NonFungibleToken.Collection, CollectionPublic, ViewResolver.ResolverCollection}>(self.CollectionStoragePath)
        self.account.capabilities.publish(collectionCap, at: self.CollectionPublicPath)

        // Create a Minter resource and save it to storage
        let minter <- create NFTMinter()
        self.account.storage.save(<-minter, to: self.MinterStoragePath)

        emit ContractInitialized()
    }
}