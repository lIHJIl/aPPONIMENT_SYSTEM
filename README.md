# 🏥 MediCare: Your Clinic, Simplified.

Welcome to **MediCare**! I've built this system to take the headache out of clinic management. Whether you're a patient looking for a quick check-up or a busy clinic admin trying to keep the schedule tight, MediCare has your back. 

It’s modern, it’s fast, and it looks great in both light and dark modes (because we know healthcare doesn't just happen during the day!).

---

## 🚀 How to get this running (The "No-Headache" Guide)

I've kept the setup as simple as possible. Just follow these steps:

### 1. Grab the code
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 2. Install the bits and pieces
You'll need to install dependencies for both the backend and frontend .

```bash
# Install everything for the frontend
npm install

# Hop into the server folder and install its needs
cd server
npm install
cd ..
```

### 3. Let's go!
I've set up a single command to start both the server and the app at the same time. Run this from the root folder:

```bash
npm run all
```

*   **Your App**: [http://localhost:5173](http://localhost:5173)
*   **The API**: [http://localhost:3000](http://localhost:3000)

---

## ❤️ What makes MediCare special?

### For Patients:
*   **Sign-up in seconds**: No long forms. Just your name, email, and a secure password.
*   **Smart Booking**: No more "is the doctor available?" guesswork. You only see slots that are actually open.
*   **Your History**: Keep track of all your visits and health notes in one place.

### For Admins & Staff:
*   **Team Control**: Easily add or manage doctors, their specialties, and their experience.
*   **Clinic Heartbeat**: Set your own working hours and break times. The system handles the rest.
*   **Conflict Prevention**: I've built in a "gatekeeper" that prevents double-booking, so your doctors stay sane.

### For Everyone:
*   **Night Shift Friendly**: Full dark mode support that actually looks good (no more blinding white screens).
*   **Real-time Updates**: Smooth "Toast" notifications keep you in the loop without annoying popups.

---

## 🛠 What's under the hood?

I wanted to keep this project modern and robust, so I used:

*   **Frontend**: React 19 + Vite (it's lightning fast).
*   **Backend**: Node.js + Express (the reliable duo).
*   **Database**: SQLite3 (persistent and zero-configuration).
*   **Security**: Real password hashing (`scrypt`) because your privacy matters.
*   **Design**: Pure Vanilla CSS logic—no bulky frameworks, just clean design tokens and smooth animations.

---

## 🔑 Want to test it out?
If you're just exploring, you can use these admin credentials:

*   **Email**: `admin@medicare.com`
*   **Password**: `admin123`

---

*Made with care to make healthcare a bit more human.* 🩺✨
