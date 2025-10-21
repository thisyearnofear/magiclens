// ARAssetNFT.cdc - Minimal working version for MagicLens
// Simple NFT contract for AR overlays

import NonFungibleToken from 0xf8d6e0586b0a20c7
import ViewResolver from 0xf8d6e0586b0a20c7
import MetadataViews from 0xf8d6e0586b0a20c7

access(all) contract ARAssetNFT: NonFungibleToken {

    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event Minted(id: UInt64, creator: Address)

    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath

    access(all) var totalSupply: UInt64

    access(all) resource NFT: NonFungibleToken.NFT, ViewResolver.Resolver {
        access(all) let id: UInt64
        access(all) let name: String
        access(all) let description: String
        access(all) let creator: Address

        init(id: UInt64, name: String, description: String, creator: Address) {
            self.id = id
            self.name = name
            self.description = description
            self.creator = creator
        }

        access(all) view fun getViews(): [Type] {
            return [Type<MetadataViews.Display>()]
        }

        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: self.name,
                        description: self.description,
                        thumbnail: MetadataViews.HTTPFile(url: "https://magiclens.app/logo.png")
                    )
            }
            return nil
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-ARAssetNFT.createEmptyCollection(nftType: Type<@ARAssetNFT.NFT>())
        }
    }

    access(all) resource Collection: NonFungibleToken.Collection {
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

    access(all) fun createEmptyCollection(nftType: Type): @{NonFungibleToken.Collection} {
        return <- create Collection()
    }

    access(all) view fun getContractViews(resourceType: Type?): [Type] {
        return [Type<MetadataViews.NFTCollectionData>()]
    }

    access(all) fun resolveContractView(resourceType: Type?, viewType: Type): AnyStruct? {
        switch viewType {
            case Type<MetadataViews.NFTCollectionData>():
                return MetadataViews.NFTCollectionData(
                    storagePath: self.CollectionStoragePath,
                    publicPath: self.CollectionPublicPath,
                    publicCollection: Type<&Collection>(),
                    publicLinkedType: Type<&{NonFungibleToken.Collection}>(),
                    createEmptyCollectionFunction: (fun (): @{NonFungibleToken.Collection} {
                        return <-ARAssetNFT.createEmptyCollection(nftType: Type<@ARAssetNFT.NFT>())
                    })
                )
        }
        return nil
    }

    access(all) resource NFTMinter {
        access(all) fun mintNFT(
            recipient: &{NonFungibleToken.Receiver},
            name: String,
            description: String,
            creator: Address
        ): UInt64 {
            let newNFT <- create NFT(
                id: ARAssetNFT.totalSupply,
                name: name,
                description: description,
                creator: creator
            )

            let id = newNFT.id
            emit Minted(id: id, creator: creator)

            recipient.deposit(token: <-newNFT)
            ARAssetNFT.totalSupply = ARAssetNFT.totalSupply + 1

            return id
        }
    }

    init() {
        self.totalSupply = 0
        self.CollectionStoragePath = /storage/ARAssetNFTCollection
        self.CollectionPublicPath = /public/ARAssetNFTCollection
        self.MinterStoragePath = /storage/ARAssetNFTMinter

        let collection <- create Collection()
        self.account.storage.save(<-collection, to: self.CollectionStoragePath)

        let collectionCap = self.account.capabilities.storage.issue<&{NonFungibleToken.Collection}>(self.CollectionStoragePath)
        self.account.capabilities.publish(collectionCap, at: self.CollectionPublicPath)

        let minter <- create NFTMinter()
        self.account.storage.save(<-minter, to: self.MinterStoragePath)

        emit ContractInitialized()
    }
}