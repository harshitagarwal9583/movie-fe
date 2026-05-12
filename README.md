# Movie Recommendation System - Frontend

## 🛠 Setup Instructions

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

The frontend will run on **http://localhost:3000**

### 3. Build for Production
```bash
npm run build
```

## 🎨 Features Included

- **Netflix-style Dark UI** - Modern, clean design with Tailwind CSS
- **Authentication Pages** - Signup, Login, OTP verification
- **Movie Filter System** - Genre, Mood, Release Year, Rating
- **Responsive Design** - Works on mobile, tablet, desktop
- **Axios Integration** - API client with auto token injection
- **Framer Motion** - Smooth animations on hover

## 📋 Components & Pages

### Components
- **Navbar.jsx** - Top navigation with login/logout
- **Auth.jsx** - Signup/Login with OTP verification
- **Home.jsx** - Movie recommendations & filters

### API Integration
- **api/client.js** - Axios setup with auto token handling
- **api/auth.js** - Authentication API calls (signup, login, verify OTP)

## 🚀 Technologies Used

- **React 18** - UI library
- **Vite** - Fast build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Navigation
- **Axios** - HTTP client

## 📂 Folder Structure
```
frontend/
├── src/
│   ├── components/
│   │   └── Navbar.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   └── Auth.jsx
│   ├── api/
│   │   ├── client.js
│   │   └── auth.js
│   ├── styles/
│   │   └── index.css
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## 🔗 Backend Connection

Make sure your backend is running on **http://localhost:5000** before starting the frontend.

The frontend automatically connects to:
- `http://localhost:5000/api/auth` for authentication
- More API routes will be added for movie recommendations

## ✅ Next Steps

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to http://localhost:3000
4. Test signup/login flow

