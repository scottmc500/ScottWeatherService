# 🧪 Complete Testing Guide for Scott Weather Service

This guide will help you test the full application with both Firebase Functions and frontend working together.

## 📋 Prerequisites

1. **Firebase CLI installed**: `npm install -g firebase-tools`
2. **Node.js 18+ installed**
3. **Google Cloud Project with Firebase enabled**
4. **Google OAuth credentials configured**

## 🚀 Phase 1: Environment Setup

### 1.1 Start Firebase Emulators
```bash
# In project root
firebase emulators:start
```
This should start:
- Functions emulator (port 5001)
- Firestore emulator (port 8080)
- Auth emulator (port 9099) - if enabled

### 1.2 Verify Environment Variables
Check `frontend/.env.local` has:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
```

### 1.3 Build and Start Functions
```bash
# Terminal 1: Functions
cd functions
npm install
npm run build
npm run serve
```

### 1.4 Start Frontend
```bash
# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

## 🧪 Phase 2: Integration Testing

### 2.1 Basic Application Test
1. **Open browser**: Navigate to `http://localhost:3000`
2. **Sign in**: Use Google OAuth to sign in
3. **Verify dashboard loads**: Check all tabs work
4. **Check weather data**: Verify weather API calls work

### 2.2 Calendar Integration Test
1. **Navigate to Calendar tab**
2. **You should see 3 components**:
   - Calendar Integration (connect/disconnect)
   - Calendar Sync (sync events)
   - Calendar Test (comprehensive testing)

### 2.3 Google Calendar Connection Test
1. **Click "Connect Google Calendar"** in Calendar Integration component
2. **Complete OAuth flow**:
   - Should redirect to Google
   - Grant calendar permissions
   - Should redirect back to app
3. **Verify connection**:
   - Green checkmark should appear
   - "Google Calendar is connected!" message
   - Calendar Test should show "Connected to Google Calendar"

### 2.4 Calendar Sync Test
1. **Click "Sync Calendar"** in Calendar Sync component
2. **Verify sync works**:
   - Should show "Syncing..." state
   - Should display success message
   - Should show number of events synced
3. **Check events display**:
   - Events should appear in the component
   - Event details should be visible

### 2.5 Comprehensive Test Suite
1. **Click "Run Tests"** in Calendar Test component
2. **Verify all tests pass**:
   - ✅ Calendar Access: Connected to Google Calendar
   - ✅ Calendar Sync: Sync successful
   - Events found: Should show actual events
3. **Check console logs** for detailed information

## 🔍 Phase 3: Debugging & Verification

### 3.1 Browser Console Checks
Open browser DevTools and check for:
- ✅ No JavaScript errors
- ✅ Firebase connection logs
- ✅ Calendar API calls
- ✅ Token storage/retrieval logs

### 3.2 Firebase Emulator Checks
Check emulator UI at `http://localhost:4000`:
- **Functions**: Should show deployed functions
- **Firestore**: Should show user documents with calendar tokens
- **Auth**: Should show authenticated users

### 3.3 Network Tab Verification
In browser DevTools Network tab:
- ✅ Firebase Functions calls (localhost:5001)
- ✅ Google OAuth redirects
- ✅ Calendar API calls (if any direct calls)

## 🐛 Common Issues & Solutions

### Issue 1: "User must be authenticated" Error
**Solution**: Make sure you're signed in with Firebase Auth before testing calendar features.

### Issue 2: "No calendar access token found" Error
**Solution**: 
1. Complete the OAuth flow properly
2. Check that tokens are stored in Firestore
3. Verify Firebase Functions can access the tokens

### Issue 3: Functions not responding
**Solution**:
1. Check functions are built: `npm run build` in functions directory
2. Check functions are running: `npm run serve` in functions directory
3. Verify emulator is running: `firebase emulators:start`

### Issue 4: CORS errors
**Solution**: 
1. Check Firebase Functions have CORS enabled
2. Verify emulator configuration
3. Check environment variables

## 📊 Expected Test Results

### Successful Integration Should Show:
1. **Calendar Integration Component**:
   - ✅ Green checkmark when connected
   - "Google Calendar is connected!" message
   - "Load Calendar Events" button works

2. **Calendar Sync Component**:
   - ✅ "Connected" status
   - Sync button works
   - Shows actual calendar events
   - Success message with event count

3. **Calendar Test Component**:
   - ✅ Calendar Access: Connected
   - ✅ Calendar Sync: Successful
   - Shows actual events from your calendar
   - No error messages

### Console Logs Should Show:
```
✅ Calendar access tokens received
✅ Tokens stored in localStorage
✅ Tokens synced to Firestore
✅ Calendar events loaded via CalendarSyncService: X events
✅ Calendar sync successful
```

## 🎯 Success Criteria

Your integration is working correctly if:
- [ ] User can sign in with Google
- [ ] Calendar connection flow works end-to-end
- [ ] Calendar events are retrieved and displayed
- [ ] All test components show success states
- [ ] No JavaScript errors in console
- [ ] Firebase Functions respond correctly
- [ ] Tokens are stored in both localStorage and Firestore

## 🚀 Next Steps After Testing

Once testing is complete:
1. **Deploy to production** (when ready)
2. **Add error handling** for edge cases
3. **Implement token refresh** logic
4. **Add real-time calendar updates**
5. **Integrate with weather recommendations**

## 📞 Troubleshooting

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure Firebase emulators are running
4. Check that Google OAuth credentials are configured
5. Verify network connectivity to Google APIs

---

**Happy Testing! 🎉**
