// Transaction to set up user account with NFT collection
export const setupAccountTransaction = `
import ARAssetNFT from 0xARAssetNFT
import NonFungibleToken from 0xNonFungibleToken
import MetadataViews from 0xMetadataViews

transaction {
    prepare(signer: AuthAccount) {
        // Check if collection already exists
        if signer.borrow<&ARAssetNFT.Collection>(from: ARAssetNFT.CollectionStoragePath) == nil {
            // Create a new empty collection
            let collection <- ARAssetNFT.createEmptyCollection()
            
            // Save it to storage
            signer.save(<-collection, to: ARAssetNFT.CollectionStoragePath)
            
            // Create a public capability for the collection
            signer.link<&ARAssetNFT.Collection{NonFungibleToken.CollectionPublic, ARAssetNFT.CollectionPublic, MetadataViews.ResolverCollection}>(
                ARAssetNFT.CollectionPublicPath,
                target: ARAssetNFT.CollectionStoragePath
            )
        }
    }
}
`;