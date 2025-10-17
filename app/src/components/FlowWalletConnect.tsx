import { useFlowAuth } from '../hooks/use-flow-auth';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, Wallet, LogOut, CheckCircle2 } from 'lucide-react';

export function FlowWalletConnect() {
  const { user, isLoggedIn, walletAddress, isLoading, connectWallet, disconnectWallet } = useFlowAuth();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <Button disabled variant="outline">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (isLoggedIn && walletAddress) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Connected to Flow
          </CardTitle>
          <CardDescription>Your wallet is connected</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Wallet Address:</span>
            <Badge variant="secondary" className="font-mono">
              {formatAddress(walletAddress)}
            </Badge>
          </div>
          <Button onClick={disconnectWallet} variant="destructive" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Connect Flow Wallet</CardTitle>
        <CardDescription>
          Connect your Flow wallet to mint AR NFTs, create collaborations, and manage workflows
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={connectWallet} className="w-full" size="lg">
          <Wallet className="mr-2 h-5 w-5" />
          Connect Wallet
        </Button>
        <p className="mt-4 text-xs text-muted-foreground text-center">
          Supports Flow Wallet, Blocto, Lilico, and other Flow-compatible wallets
        </p>
      </CardContent>
    </Card>
  );
}