import { useEffect } from 'react';
import { useFlowAuth } from '../hooks/use-flow-auth';
import { useFlowNFTs } from '../hooks/use-flow-nfts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Loader2, Image as ImageIcon, Video, FileImage } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

const CATEGORY_NAMES = ['Creatures', 'Effects', 'Objects', 'Text', 'Decorations'];
const LICENSE_NAMES = ['Personal', 'Commercial', 'Exclusive'];

export function FlowNFTGallery() {
  const { walletAddress, isLoggedIn } = useFlowAuth();
  const { nfts, isLoading, error, fetchNFTs, setupAccount } = useFlowNFTs(walletAddress);

  useEffect(() => {
    if (isLoggedIn && walletAddress) {
      fetchNFTs();
    }
  }, [isLoggedIn, walletAddress, fetchNFTs]);

  const getAssetIcon = (assetType: string) => {
    switch (assetType) {
      case 'gif':
        return <ImageIcon className="h-4 w-4" />;
      case 'mp4':
        return <Video className="h-4 w-4" />;
      case 'png':
        return <FileImage className="h-4 w-4" />;
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  };

  if (!isLoggedIn) {
    return (
      <Alert>
        <AlertDescription>
          Please connect your Flow wallet to view your AR Asset NFTs
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error}
          <Button onClick={() => setupAccount()} variant="outline" size="sm" className="ml-4">
            Setup Account
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (nfts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No AR Asset NFTs</CardTitle>
          <CardDescription>
            You haven't minted any AR assets as NFTs yet. Upload an asset and mint it to get started!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setupAccount()} variant="outline">
            Setup Account for NFTs
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your AR Asset NFTs</h2>
        <Badge variant="secondary">{nfts.length} NFTs</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nfts.map((nft) => (
          <Card key={nft.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square relative bg-muted">
              {nft.thumbnailURL ? (
                <img
                  src={nft.thumbnailURL}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {getAssetIcon(nft.assetType)}
                </div>
              )}
              <Badge className="absolute top-2 right-2">
                #{nft.id}
              </Badge>
            </div>
            
            <CardHeader>
              <CardTitle className="text-lg">{nft.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {nft.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Category:</span>
                <Badge variant="outline">
                  {CATEGORY_NAMES[nft.category] || 'Unknown'}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Type:</span>
                <div className="flex items-center gap-1">
                  {getAssetIcon(nft.assetType)}
                  <span className="uppercase font-mono text-xs">{nft.assetType}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Usage Count:</span>
                <Badge variant="secondary">{nft.usageCount}</Badge>
              </div>

              <div className="pt-2 border-t">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={nft.fileURL} target="_blank" rel="noopener noreferrer">
                    View Asset
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}