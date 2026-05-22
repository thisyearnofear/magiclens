import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { FlowWalletConnect } from './FlowWalletConnect';
import { FlowNFTGallery } from './FlowNFTGallery';
import { FlowWorkflowManager } from './FlowWorkflowManager';
import { useFlowAuth } from '../hooks/use-flow-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Wallet, Image, Zap, Users } from 'lucide-react';

export function FlowDashboard() {
  const { isLoggedIn } = useFlowAuth();

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Flow Blockchain Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your AR Asset NFTs, workflows, and collaborations on Flow
        </p>
      </div>

      {!isLoggedIn ? (
        <div className="flex items-center justify-center py-12">
          <FlowWalletConnect />
        </div>
      ) : (
        <Tabs defaultValue="nfts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Wallet
            </TabsTrigger>
            <TabsTrigger value="nfts" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              NFTs
            </TabsTrigger>
            <TabsTrigger value="workflows" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="collaborations" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Collaborations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="space-y-4">
            <FlowWalletConnect />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Flow Network</CardTitle>
                  <CardDescription>Current blockchain network</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">Testnet</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Smart Contracts</CardTitle>
                  <CardDescription>Deployed contracts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <p>• ARAssetNFT</p>
                    <p>• CollaborationHub</p>
                    <p>• ForteAutomation</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Features</CardTitle>
                  <CardDescription>Available capabilities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <p>• NFT Minting</p>
                    <p>• Forte Workflows</p>
                    <p>• Collaboration</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="nfts">
            <FlowNFTGallery />
          </TabsContent>

          <TabsContent value="workflows">
            <FlowWorkflowManager />
          </TabsContent>

          <TabsContent value="collaborations">
            <Card>
              <CardHeader>
                <CardTitle>Collaboration Projects</CardTitle>
                <CardDescription>
                  Manage your collaborative AR projects with revenue sharing and contribution tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Collaboration features coming soon. Create projects, add team members, and automatically distribute royalties.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}