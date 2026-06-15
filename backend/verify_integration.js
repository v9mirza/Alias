import http from 'http';
import { Server } from 'socket.io';
import ioClient from 'socket.io-client';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import backend app modules
import app from './src/app.js';
import { socketHandler } from './src/sockets/socketHandler.js';
import User from './src/models/User.js';
import ChatRequest from './src/models/ChatRequest.js';
import Conversation from './src/models/Conversation.js';
import Message from './src/models/Message.js';

dotenv.config();

const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}`;
const MONGODB_TEST_URI = 'mongodb://admin:pass@127.0.0.1:27017/alias_integration_test?authSource=admin';

// Override env variables for test run
process.env.MONGODB_URI = MONGODB_TEST_URI;
process.env.JWT_SECRET = 'alias_test_secret_key_12345';
process.env.JWT_EXPIRES_IN = '1h';

let server;
let io;
let aliceToken = '';
let bobToken = '';
let aliceId = '';
let bobId = '';
let requestId = '';
let conversationId = '';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('--- STARTING INTEGRATION TESTS FOR ALIAS BACKEND ---');

  // 1. Establish MongoDB connection
  console.log(`Connecting to test database: ${MONGODB_TEST_URI}`);
  await mongoose.connect(MONGODB_TEST_URI);
  console.log('Connected to MongoDB.');

  // 2. Clear Database Collections
  console.log('Cleaning up database...');
  await User.deleteMany({});
  await ChatRequest.deleteMany({});
  await Conversation.deleteMany({});
  await Message.deleteMany({});
  console.log('Database cleaned.');

  // 3. Start Test HTTP & Socket.IO server
  console.log(`Starting test server on port ${PORT}...`);
  server = http.createServer(app);
  io = new Server(server, {
    cors: { origin: '*' }
  });
  socketHandler(io);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log('Test server is listening.');

  try {
    // --- HTTP AUTHENTICATION TESTS ---
    console.log('\n--- 1. HTTP API: Authentication ---');

    // Register Alice
    const regAliceRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_alice', password: 'password123' })
    });
    const regAliceData = await regAliceRes.json();
    if (!regAliceRes.ok || !regAliceData.success) {
      throw new Error(`Failed to register Alice: ${JSON.stringify(regAliceData)}`);
    }
    console.log('✅ Alice registered successfully');
    aliceToken = regAliceData.data.token;
    aliceId = regAliceData.data.user.id;

    // Try registering Alice again (Duplicate check)
    const dupRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_alice', password: 'differentpassword' })
    });
    const dupRegData = await dupRegRes.json();
    if (dupRegRes.ok || dupRegData.success) {
      throw new Error('Allowed duplicate username registration! Expected failure.');
    }
    console.log('✅ Duplicate username registration rejected properly');

    // Register Bob
    const regBobRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_bob', password: 'bobpassword' })
    });
    const regBobData = await regBobRes.json();
    if (!regBobRes.ok || !regBobData.success) {
      throw new Error('Failed to register Bob');
    }
    console.log('✅ Bob registered successfully');
    bobToken = regBobData.data.token;
    bobId = regBobData.data.user.id;

    // Login Alice
    const loginAliceRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_alice', password: 'password123' })
    });
    const loginAliceData = await loginAliceRes.json();
    if (!loginAliceRes.ok || !loginAliceData.success || !loginAliceData.data.token) {
      throw new Error('Alice login failed');
    }
    console.log('✅ Alice logged in successfully');

    // Login with invalid credentials
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_alice', password: 'wrongpassword' })
    });
    const badLoginData = await badLoginRes.json();
    if (badLoginRes.ok || badLoginData.success) {
      throw new Error('Login with incorrect password succeeded! Expected failure.');
    }
    console.log('✅ Incorrect password login rejected properly');

    // Get current user (Me)
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${aliceToken}`
      }
    });
    const meData = await meRes.json();
    if (!meRes.ok || meData.data.user.username !== 'test_alice') {
      throw new Error('Get Me API failed');
    }
    console.log('✅ Current User (Me) profile retrieved successfully');

    // --- HTTP USER PROFILES & SEARCH TESTS ---
    console.log('\n--- 2. HTTP API: Users Profile & Search ---');

    // Update profile
    const updateRes = await fetch(`${BASE_URL}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aliceToken}`
      },
      body: JSON.stringify({
        bio: 'Anonymous code monkey.',
        interests: ['JavaScript', 'Cryptography', 'Cats']
      })
    });
    const updateData = await updateRes.json();
    if (!updateRes.ok || updateData.data.user.bio !== 'Anonymous code monkey.') {
      throw new Error('Profile update failed');
    }
    console.log('✅ User profile updated successfully');

    // Get profile
    const getProfileRes = await fetch(`${BASE_URL}/api/users/${bobId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${aliceToken}` }
    });
    const getProfileData = await getProfileRes.json();
    if (!getProfileRes.ok || getProfileData.data.user.username !== 'test_bob') {
      throw new Error('Get profile by ID failed');
    }
    console.log('✅ Get profile by ID retrieved successfully');

    // Search users (expecting to find Bob but not Alice)
    const searchRes = await fetch(`${BASE_URL}/api/users/search?q=bob`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${aliceToken}` }
    });
    const searchData = await searchRes.json();
    if (!searchRes.ok || searchData.data.users.length !== 1 || searchData.data.users[0].username !== 'test_bob') {
      throw new Error(`User search failed: ${JSON.stringify(searchData)}`);
    }
    console.log('✅ Search user (excluding self) returned expected results');

    // --- HTTP CHAT REQUEST TESTS ---
    console.log('\n--- 3. HTTP API: Chat Requests ---');

    // Send request to self (expecting rejection)
    const selfReqRes = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aliceToken}`
      },
      body: JSON.stringify({ receiverId: aliceId })
    });
    const selfReqData = await selfReqRes.json();
    if (selfReqRes.ok || selfReqData.success) {
      throw new Error('Allowed sending chat request to self! Expected failure.');
    }
    console.log('✅ Request to self rejected properly');

    // Send request Alice -> Bob (temporary chat, 1h expiry)
    const sendReqRes = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aliceToken}`
      },
      body: JSON.stringify({ receiverId: bobId, isTemporary: true, expiryDuration: '1h' })
    });
    const sendReqData = await sendReqRes.json();
    if (!sendReqRes.ok || !sendReqData.success) {
      throw new Error(`Failed to send chat request: ${JSON.stringify(sendReqData)}`);
    }
    console.log('✅ Chat request sent successfully');
    requestId = sendReqData.data.request._id;

    // Send duplicate request Alice -> Bob (expecting rejection)
    const dupReqRes = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aliceToken}`
      },
      body: JSON.stringify({ receiverId: bobId })
    });
    const dupReqData = await dupReqRes.json();
    if (dupReqRes.ok || dupReqData.success) {
      throw new Error('Allowed sending duplicate pending request! Expected failure.');
    }
    console.log('✅ Duplicate request rejected properly');

    // Get incoming requests for Bob
    const incRes = await fetch(`${BASE_URL}/api/requests/incoming`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${bobToken}` }
    });
    const incData = await incRes.json();
    if (!incRes.ok || incData.data.requests.length !== 1 || incData.data.requests[0]._id !== requestId) {
      throw new Error('Get incoming requests failed');
    }
    console.log('✅ Get incoming requests retrieved successfully');

    // Get sent requests for Alice
    const sentRes = await fetch(`${BASE_URL}/api/requests/sent`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${aliceToken}` }
    });
    const sentData = await sentRes.json();
    if (!sentRes.ok || sentData.data.requests.length !== 1 || sentData.data.requests[0]._id !== requestId) {
      throw new Error('Get sent requests failed');
    }
    console.log('✅ Get sent requests retrieved successfully');

    // Accept request Bob -> Alice
    const acceptRes = await fetch(`${BASE_URL}/api/requests/${requestId}/accept`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${bobToken}` }
    });
    const acceptData = await acceptRes.json();
    if (!acceptRes.ok || !acceptData.success) {
      throw new Error(`Failed to accept request: ${JSON.stringify(acceptData)}`);
    }
    console.log('✅ Chat request accepted successfully');
    conversationId = acceptData.data.conversation._id;

    // Check that conversation exists and is temporary
    if (!acceptData.data.conversation.isTemporary || !acceptData.data.conversation.expiresAt) {
      throw new Error('Created conversation does not match temporary configurations!');
    }
    console.log('✅ Conversation created with temporary settings and expiresAt date');

    // Verify conversation uniquely saved (re-accepting fails)
    const reAcceptRes = await fetch(`${BASE_URL}/api/requests/${requestId}/accept`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${bobToken}` }
    });
    if (reAcceptRes.ok) {
      throw new Error('Re-accepted request! Expected failure.');
    }
    console.log('✅ Accepting request again rejected properly');

    // --- HTTP CONVERSATIONS & MESSAGES API TESTS ---
    console.log('\n--- 4. HTTP API: Conversations & Messages ---');

    // Get conversations
    const getConvRes = await fetch(`${BASE_URL}/api/conversations`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${aliceToken}` }
    });
    const getConvData = await getConvRes.json();
    if (!getConvRes.ok || getConvData.data.conversations.length !== 1) {
      throw new Error('Get conversations list failed');
    }
    console.log('✅ Conversations list retrieved successfully');

    // Get messages for conversation (should be empty initially)
    const getMsgRes = await fetch(`${BASE_URL}/api/conversations/${conversationId}/messages`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${aliceToken}` }
    });
    const getMsgData = await getMsgRes.json();
    if (!getMsgRes.ok || getMsgData.data.messages.length !== 0) {
      throw new Error('Get messages returned messages! Expected empty list.');
    }
    console.log('✅ Messages for conversation are empty initially as expected');

    // Unauthorized access to messages (e.g. invalid conversation ID)
    const fakeId = new mongoose.Types.ObjectId();
    const badMsgRes = await fetch(`${BASE_URL}/api/conversations/${fakeId}/messages`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${aliceToken}` }
    });
    if (badMsgRes.ok) {
      throw new Error('Allowed unauthorized user to fetch messages! Expected failure.');
    }
    console.log('✅ Unauthorized messages access rejected properly');

    // --- REALTIME SOCKET.IO TESTS ---
    console.log('\n--- 5. Real-time Socket.IO Events ---');

    let aliceSocket;
    let bobSocket;

    // Connect Alice Socket
    aliceSocket = ioClient(BASE_URL, {
      auth: { token: aliceToken }
    });

    await new Promise((resolve, reject) => {
      aliceSocket.on('connect', resolve);
      aliceSocket.on('connect_error', reject);
    });
    console.log('✅ Alice connected to Socket.IO successfully');

    // Check Alice online status in DB
    const aliceUserAfter = await User.findById(aliceId);
    if (!aliceUserAfter.isOnline) {
      throw new Error('Alice isOnline flag not set to true after connecting!');
    }
    console.log('✅ Alice user record correctly set to isOnline = true');

    // Connect Bob Socket and listen for online status changes
    let aliceReceivedOnlineBroadcast = false;
    aliceSocket.on('user_online', (data) => {
      if (data.userId === bobId) {
        aliceReceivedOnlineBroadcast = true;
      }
    });

    bobSocket = ioClient(BASE_URL, {
      auth: { token: bobToken }
    });

    await new Promise((resolve) => bobSocket.on('connect', resolve));
    console.log('✅ Bob connected to Socket.IO successfully');
    await delay(100); // Give socket event handler time to run

    if (!aliceReceivedOnlineBroadcast) {
      throw new Error('Alice did not receive online broadcast for Bob!');
    }
    console.log('✅ Broadcast online status received by Alice');

    // Send Message: Alice -> Bob
    let bobReceivedMessage = null;
    bobSocket.on('receive_message', (msg) => {
      bobReceivedMessage = msg;
    });

    const sendMsgPromise = new Promise((resolve) => {
      aliceSocket.emit(
        'send_message',
        { conversationId, content: 'Hey Bob, this is private!' },
        (res) => resolve(res)
      );
    });

    const sendMsgResult = await sendMsgPromise;
    if (!sendMsgResult.success) {
      throw new Error('Socket send_message callback failed');
    }
    console.log('✅ Message sent via Alice socket with successful acknowledgment callback');

    await delay(150); // wait for event propagation

    if (!bobReceivedMessage || bobReceivedMessage.content !== 'Hey Bob, this is private!') {
      throw new Error('Bob did not receive the message in real-time!');
    }
    console.log('✅ Message received in real-time by Bob socket:');
    console.log(`   Content: "${bobReceivedMessage.content}"`);

    // Verify message saved to DB
    const dbMsg = await Message.findOne({ conversationId });
    if (!dbMsg || dbMsg.content !== 'Hey Bob, this is private!' || dbMsg.isRead) {
      throw new Error('Message not properly saved to MongoDB!');
    }
    console.log('✅ Message successfully saved to database');

    // Typing Indicators: Bob typing
    let aliceReceivedTypingStart = false;
    aliceSocket.on('typing_start', (data) => {
      if (data.conversationId === conversationId && data.senderId === bobId) {
        aliceReceivedTypingStart = true;
      }
    });

    bobSocket.emit('typing_start', { conversationId });
    await delay(100);
    if (!aliceReceivedTypingStart) {
      throw new Error('Alice did not receive typing_start event');
    }
    console.log('✅ Typing start indicator received by partner');

    let aliceReceivedTypingStop = false;
    aliceSocket.on('typing_stop', (data) => {
      if (data.conversationId === conversationId && data.senderId === bobId) {
        aliceReceivedTypingStop = true;
      }
    });

    bobSocket.emit('typing_stop', { conversationId });
    await delay(100);
    if (!aliceReceivedTypingStop) {
      throw new Error('Alice did not receive typing_stop event');
    }
    console.log('✅ Typing stop indicator received by partner');

    // Read receipts
    let aliceReceivedReadReceipt = false;
    aliceSocket.on('message_read_receipt', (data) => {
      if (data.conversationId === conversationId && data.readerId === bobId) {
        aliceReceivedReadReceipt = true;
      }
    });

    const readMsgPromise = new Promise((resolve) => {
      bobSocket.emit('message_read', { conversationId }, (res) => resolve(res));
    });
    const readMsgResult = await readMsgPromise;
    if (!readMsgResult.success) {
      throw new Error('Message read socket action failed');
    }
    await delay(100);

    if (!aliceReceivedReadReceipt) {
      throw new Error('Alice did not receive read receipt event');
    }
    console.log('✅ Message read receipt received by sender');

    // Verify messages marked read in MongoDB
    const readDbMsg = await Message.findById(dbMsg._id);
    if (!readDbMsg.isRead) {
      throw new Error('Message isRead flag not set to true in DB after read receipt!');
    }
    console.log('✅ Message marked as read in database successfully');

    // Disconnect Bob and verify offline broadcast
    let aliceReceivedOfflineBroadcast = false;
    aliceSocket.on('user_offline', (data) => {
      if (data.userId === bobId) {
        aliceReceivedOfflineBroadcast = true;
      }
    });

    bobSocket.disconnect();
    await delay(100);

    if (!aliceReceivedOfflineBroadcast) {
      throw new Error('Alice did not receive offline broadcast for Bob!');
    }
    console.log('✅ Broadcast offline status received by Alice after Bob disconnected');

    const bobUserAfter = await User.findById(bobId);
    if (bobUserAfter.isOnline) {
      throw new Error('Bob isOnline flag remains true in DB after disconnect!');
    }
    console.log('✅ Bob user record correctly set to isOnline = false');

    aliceSocket.disconnect();

    // --- TEMPORARY CHATS CLEANUP JOB TEST ---
    console.log('\n--- 6. Cleanup Cron Job ---');

    // Clear any existing conversations to avoid duplicate key error
    await Conversation.deleteMany({});

    // Create an expired temporary conversation
    const expiredConv = await Conversation.create({
      participants: [aliceId, bobId],
      isTemporary: true,
      expiresAt: new Date(Date.now() - 5000) // expired 5 seconds ago
    });

    // Create an associated message
    await Message.create({
      conversationId: expiredConv._id,
      sender: aliceId,
      content: 'This message should be purged'
    });

    // Execute the core logic of the cron job directly
    const runCleanup = async () => {
      const expiredConvs = await Conversation.find({
        isTemporary: true,
        expiresAt: { $lt: new Date() }
      }).select('_id');

      if (expiredConvs.length > 0) {
        const expiredIds = expiredConvs.map(c => c._id);
        await Message.deleteMany({ conversationId: { $in: expiredIds } });
        await Conversation.deleteMany({ _id: { $in: expiredIds } });
        return expiredIds.length;
      }
      return 0;
    };

    const purgedCount = await runCleanup();
    if (purgedCount === 0) {
      throw new Error('Cleanup job did not find or purge the expired conversation!');
    }
    console.log(`✅ Cleanup logic successfully purged ${purgedCount} expired conversation(s)`);

    // Verify message was also deleted
    const deletedMsgCount = await Message.countDocuments({ conversationId: expiredConv._id });
    if (deletedMsgCount > 0) {
      throw new Error('Expired conversation messages were not deleted!');
    }
    console.log('✅ Expired conversation messages purged successfully');

    // Confirm success
    console.log('\n🌟 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🌟');
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED WITH ERROR:');
    console.error(error);
    process.exitCode = 1;
  } finally {
    console.log('\nClosing server and database connections...');
    if (server) server.close();
    await mongoose.connection.close();
    console.log('Cleanup finished. Exiting test process.');
  }
}

runTests();
