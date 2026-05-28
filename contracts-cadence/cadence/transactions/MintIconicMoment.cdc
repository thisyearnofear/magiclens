import ARAssetNFT from 0x4520a5a7b69ee3ac
import NonFungibleToken from 0x631e88ae7f1d7c20

transaction(name: String, description: String, creator: Address, mediaURI: String) {
    let minterRef: &ARAssetNFT.NFTMinter
    let recipientRef: &{NonFungibleToken.Receiver}

    prepare(signer: auth(Storage) &Account) {
        self.minterRef = signer.storage.borrow<&ARAssetNFT.NFTMinter>(
            from: /storage/ARAssetNFTMinter
        ) ?? panic("No minter resource in account — deployer must have NFTMinter at /storage/ARAssetNFTMinter")

        let collectionCap = signer.capabilities.get<&{NonFungibleToken.Receiver}>(
            ARAssetNFT.CollectionPublicPath
        )
        self.recipientRef = collectionCap.borrow()
            ?? panic("Cannot borrow collection receiver capability")
    }

    execute {
        self.minterRef.mintNFT(
            recipient: self.recipientRef,
            name: name,
            description: description,
            creator: creator,
            mediaURI: mediaURI
        )
    }
}
