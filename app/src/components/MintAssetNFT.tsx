import { useState } from 'react';
import { useFlowAuth } from '../hooks/use-flow-auth';
import { useFlowNFTs } from '../hooks/use-flow-nfts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface MintAssetNFTProps {
  assetData?: {
    name: string;
    fileURL: string;
    thumbnailURL?: string;
    fileSize: number;
    width: number;
    height: number;
    assetType: string;
  };
  onSuccess?: () => void;
}

const CATEGORIES = [
  { value: 0, label: 'Creatures' },
  { value: 1, label: 'Effects' },
  { value: 2, label: 'Objects' },
  { value: 3, label: 'Text' },
  { value: 4, label: 'Decorations' },
];

const LICENSE_TYPES = [
  { value: 0, label: 'Personal', description: 'Free for personal use' },
  { value: 1, label: 'Commercial', description: 'Requires payment for commercial use' },
  { value: 2, label: 'Exclusive', description: 'One-time exclusive license' },
];

export function MintAssetNFT({ assetData, onSuccess }: MintAssetNFTProps) {
  const { isLoggedIn, walletAddress } = useFlowAuth();
  const { mintAsset, setupAccount, isLoading } = useFlowNFTs(walletAddress);

  const [formData, setFormData] = useState({
    name: assetData?.name || '',
    description: '',
    category: 1, // Effects
    tags: '',
    licenseType: 0, // Personal
    royaltyPercentage: 5.0,
    enableRoyalties: true,
  });

  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  const handleSetupAccount = async () => {
    try {
      setError(null);
      await setupAccount();
      setNeedsSetup(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup account');
    }
  };

  const handleMint = async () => {
    if (!assetData) {
      setError('No asset data provided');
      return;
    }

    if (!formData.name || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setError(null);
      
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await mintAsset({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        assetType: assetData.assetType,
        fileURL: assetData.fileURL,
        thumbnailURL: assetData.thumbnailURL,
        fileSize: assetData.fileSize,
        width: assetData.width,
        height: assetData.height,
        tags,
        licenseType: formData.licenseType,
        royaltyPercentage: formData.enableRoyalties ? formData.royaltyPercentage : 0,
      });

      onSuccess?.();
    } catch (err: any) {
      console.error('Minting error:', err);
      if (err.message?.includes('not initialized') || err.message?.includes('collection')) {
        setNeedsSetup(true);
        setError('Your account needs to be set up for NFTs. Click the button below to initialize.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to mint NFT');
      }
    }
  };

  if (!isLoggedIn) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please connect your Flow wallet to mint NFTs
        </AlertDescription>
      </Alert>
    );
  }

  if (!assetData) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No asset data provided. Please upload an asset first.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Mint as NFT on Flow
        </CardTitle>
        <CardDescription>
          Create an NFT from your AR asset with royalties and licensing options
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {needsSetup && (
          <Alert>
            <AlertDescription className="flex items-center justify-between">
              <span>Initialize your account for NFT minting</span>
              <Button onClick={handleSetupAccount} disabled={isLoading} size="sm">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Setup Account'
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Asset Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter asset name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your AR asset..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category.toString()}
                onValueChange={(value) => setFormData({ ...formData, category: parseInt(value) })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value.toString()}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseType">License Type</Label>
              <Select
                value={formData.licenseType.toString()}
                onValueChange={(value) => setFormData({ ...formData, licenseType: parseInt(value) })}
              >
                <SelectTrigger id="licenseType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_TYPES.map((license) => (
                    <SelectItem key={license.value} value={license.value.toString()}>
                      {license.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., effect, particles, animated"
            />
          </div>

          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enableRoyalties">Enable Royalties</Label>
                <p className="text-sm text-muted-foreground">
                  Earn a percentage every time your NFT is used
                </p>
              </div>
              <Switch
                id="enableRoyalties"
                checked={formData.enableRoyalties}
                onCheckedChange={(checked) => setFormData({ ...formData, enableRoyalties: checked })}
              />
            </div>

            {formData.enableRoyalties && (
              <div className="space-y-2">
                <Label htmlFor="royaltyPercentage">
                  Royalty Percentage: {formData.royaltyPercentage}%
                </Label>
                <Input
                  id="royaltyPercentage"
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={formData.royaltyPercentage}
                  onChange={(e) => setFormData({ ...formData, royaltyPercentage: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  You'll earn {formData.royaltyPercentage}% every time someone uses this asset
                </p>
              </div>
            )}
          </div>

          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h4 className="font-medium">Asset Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="outline" className="ml-2">
                  {assetData.assetType.toUpperCase()}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Size:</span>
                <span className="ml-2">{(assetData.fileSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div>
                <span className="text-muted-foreground">Dimensions:</span>
                <span className="ml-2">{assetData.width} × {assetData.height}</span>
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={handleMint}
          disabled={isLoading || !formData.name || !formData.description}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Minting NFT...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Mint as NFT
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          This will create an NFT on Flow blockchain. Transaction fees apply.
        </p>
      </CardContent>
    </Card>
  );
}