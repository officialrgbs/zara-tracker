# Firebase Firestore Setup Instructions

Follow these steps to configure your local environment and deploy the Firestore rules to your Firebase project.

## 1. Install Firebase CLI
If you haven't already, install the Firebase CLI globally:
```bash
npm install -g firebase-tools
```

## 2. Login to Firebase
Log in to your Google account associated with the Firebase project:
```bash
firebase login
```

## 3. Initialize Firebase (One-time setup)
Link your local project to your Firebase project.
1. Run the initialization command:
   ```bash
   firebase init firestore
   ```
2. **Select Project**: Choose "Use an existing project" and select your project (ID defined in your env: `process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID`).
3. **Firestore Rules**: It will ask for the rules file. Press Enter to accept the default `firestore.rules`.
4. **Firestore Indexes**: Press Enter to accept the default `firestore.indexes.json`.

**IMPORTANT**: If it asks to overwrite `firestore.rules`, say **NO** (N), because we have already updated the file with your specific validation rules.

## 4. Deploy Rules
Once initialized, you can deploy the rules to the cloud:
```bash
firebase deploy --only firestore:rules
```

## 5. Verify
Go to the [Firebase Console](https://console.firebase.google.com/), navigate to **Firestore Database** > **Rules**, and verify that the new rules are active.
