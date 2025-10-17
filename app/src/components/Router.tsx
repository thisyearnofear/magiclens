import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut } from '@/auth/AuthProvider';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';
import VideoGallery from './VideoGallery';
import AssetLibrary from './AssetLibrary';
import ProfileSetup from './ProfileSetup';
import VideoUpload from './VideoUpload';
import AssetUpload from './AssetUpload';
import CollaborationWorkspace from './CollaborationWorkspace';
import QuickCollaboration from './QuickCollaboration';
import UserProfile from './UserProfile';
import { FlowDashboard } from './FlowDashboard';

export default function Router() {
  return (
    <>
      <SignedOut>
        <LandingPage />
      </SignedOut>
      <SignedIn>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/flow" element={<FlowDashboard />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/videos" element={<VideoGallery />} />
          <Route path="/assets" element={<AssetLibrary />} />
          <Route path="/upload-video" element={<VideoUpload />} />
          <Route path="/upload-asset" element={<AssetUpload />} />
          <Route path="/collaboration/:id" element={<CollaborationWorkspace />} />
          <Route path="/quick-collab/:videoId" element={<QuickCollaboration videoId={window.location.pathname.split('/').pop() || ''} />} />
          <Route path="/profile/:id" element={<UserProfile />} />
          <Route path="/profile" element={<UserProfile />} />
        </Routes>
      </SignedIn>
    </>
  );
}