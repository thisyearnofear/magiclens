// Transaction to mint AR Asset NFT
export const mintAssetTransaction = `
import ARAssetNFT from 0xARAssetNFT
import NonFungibleToken from 0xNonFungibleToken
import MetadataViews from 0xMetadataViews

transaction(
    name: String,
    description: String,
    category: UInt8,
    assetType: String,
    fileURL: String,
    thumbnailURL: String?,
    fileSize: UInt64,
    width: UInt32,
    height: UInt32,
    duration: UFix64?,
    tags: [String],
    licenseType: UInt8,
    royaltyPercentage: UFix64
) {
    let minter: &ARAssetNFT.NFTMinter
    let recipientCollection: &ARAssetNFT.Collection{NonFungibleToken.CollectionPublic}

    prepare(signer: AuthAccount) {
        // Borrow minter reference
        self.minter = signer.borrow<&ARAssetNFT.NFTMinter>(from: ARAssetNFT.MinterStoragePath)
            ?? panic("Could not borrow minter reference")

        // Get recipient collection
        self.recipientCollection = signer.getCapability(ARAssetNFT.CollectionPublicPath)
            .borrow<&ARAssetNFT.Collection{NonFungibleToken.CollectionPublic}>()
            ?? panic("Could not borrow collection reference")
    }

    execute {
        let dimensions: {String: UInt32} = {
            "width": width,
            "height": height
        }

        let category = ARAssetNFT.Category(rawValue: category)!
        let licenseType = ARAssetNFT.LicenseType(rawValue: licenseType)!

        self.minter.mintNFT(
            recipient: self.recipientCollection,
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
            creator: self.recipientCollection.owner!.address
        )
    }
}
`;