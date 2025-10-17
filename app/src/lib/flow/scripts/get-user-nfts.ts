// Script to get user's AR Asset NFTs
export const getUserNFTsScript = `
import ARAssetNFT from 0xARAssetNFT
import NonFungibleToken from 0xNonFungibleToken
import MetadataViews from 0xMetadataViews

pub struct NFTData {
    pub let id: UInt64
    pub let name: String
    pub let description: String
    pub let category: UInt8
    pub let assetType: String
    pub let fileURL: String
    pub let thumbnailURL: String?
    pub let usageCount: UInt64
    pub let creator: Address

    init(
        id: UInt64,
        name: String,
        description: String,
        category: UInt8,
        assetType: String,
        fileURL: String,
        thumbnailURL: String?,
        usageCount: UInt64,
        creator: Address
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.category = category
        self.assetType = assetType
        self.fileURL = fileURL
        self.thumbnailURL = thumbnailURL
        self.usageCount = usageCount
        self.creator = creator
    }
}

pub fun main(address: Address): [NFTData] {
    let account = getAccount(address)
    let collection = account.getCapability(ARAssetNFT.CollectionPublicPath)
        .borrow<&ARAssetNFT.Collection{ARAssetNFT.CollectionPublic}>()
        ?? panic("Could not borrow collection reference")

    let nfts: [NFTData] = []
    let ids = collection.getIDs()

    for id in ids {
        if let nft = collection.borrowARAsset(id: id) {
            nfts.append(NFTData(
                id: nft.id,
                name: nft.metadata.name,
                description: nft.metadata.description,
                category: nft.metadata.category.rawValue,
                assetType: nft.metadata.assetType,
                fileURL: nft.metadata.fileURL,
                thumbnailURL: nft.metadata.thumbnailURL,
                usageCount: nft.metadata.usageCount,
                creator: nft.metadata.creator
            ))
        }
    }

    return nfts
}
`;