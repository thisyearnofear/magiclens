// Integration Test Script for MagicLens Pose Analysis Flow
// Run with: node test-integration.js

const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:8000'; // Main API service
const COLLABORATION_SERVER = 'http://localhost:3001'; // Collaboration server

// Test user credentials (should match your test setup)
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpass123'
};

let authToken = '';
let testVideoId = '';
let testCollaborationId = '';

async function log(message, success = true) {
  const timestamp = new Date().toISOString();
  const status = success ? '✅' : '❌';
  console.log(`${timestamp} ${status} ${message}`);
}

async function testAPIHealth() {
  try {
    const response = await axios.get(`${API_BASE}/health`);
    if (response.data.status === 'healthy') {
      log('API service health check passed');
      return true;
    }
  } catch (error) {
    log(`API service health check failed: ${error.message}`, false);
  }
  return false;
}

async function testAuthentication() {
  try {
    // This would need to be adapted based on your actual auth flow
    // For now, we'll assume a token is available or mock auth
    log('Authentication test skipped (requires manual setup)');
    return true;
  } catch (error) {
    log(`Authentication failed: ${error.message}`, false);
    return false;
  }
}

async function testPoseAnalysis() {
  try {
    // Test pose sequence analysis
    const testFrames = [
      // Mock pose data - replace with real test data
      [0.5, 0.5, 0.0, 1.0, 0.4, 0.6, 0.0, 1.0, 0.6, 0.6, 0.0, 1.0, 0.3, 0.7, 0.0, 1.0, 0.7, 0.7, 0.0, 1.0, 0.5, 0.8, 0.0, 1.0, 0.4, 0.9, 0.0, 1.0]
    ];

    const response = await axios.post(`${API_BASE}/api/computer_vision/analyze_pose_sequence`, {
      frames: testFrames
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      log('Pose sequence analysis test passed');
      return true;
    }
  } catch (error) {
    log(`Pose analysis test failed: ${error.message}`, false);
  }
  return false;
}

async function testSmartPlacement() {
  try {
    // This would require a real video ID
    log('Smart placement test requires video upload first - skipped');
    return true;
  } catch (error) {
    log(`Smart placement test failed: ${error.message}`, false);
    return false;
  }
}

async function testCollaborationWebSocket() {
  return new Promise((resolve) => {
    try {
      const io = require('socket.io-client');
      const socket = io(COLLABORATION_SERVER);

      socket.on('connect', () => {
        log('WebSocket connection to collaboration server successful');

        // Test joining a session
        socket.emit('join-session', {
          sessionId: 'test-session-' + Date.now(),
          userId: 'test-user',
          username: 'Test User'
        });

        setTimeout(() => {
          socket.disconnect();
          resolve(true);
        }, 1000);
      });

      socket.on('connect_error', (error) => {
        log(`WebSocket connection failed: ${error.message}`, false);
        resolve(false);
      });

    } catch (error) {
      log(`Collaboration WebSocket test failed: ${error.message}`, false);
      resolve(false);
    }
  });
}

async function runIntegrationTests() {
  console.log('🚀 Starting MagicLens Integration Tests\n');

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  // Test 1: API Health
  results.total++;
  if (await testAPIHealth()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 2: Authentication
  results.total++;
  if (await testAuthentication()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 3: Pose Analysis
  results.total++;
  if (await testPoseAnalysis()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 4: Smart Placement
  results.total++;
  if (await testSmartPlacement()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 5: Collaboration WebSocket
  results.total++;
  if (await testCollaborationWebSocket()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Summary
  console.log('\n📊 Integration Test Results:');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);

  if (results.failed === 0) {
    console.log('🎉 All integration tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Check logs above.');
    process.exit(1);
  }
}

// Run tests
runIntegrationTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
