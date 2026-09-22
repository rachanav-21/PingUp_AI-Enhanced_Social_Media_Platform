# PingUp – AI-Enhanced Social Media Networking Platform

PingUp is a full-stack social media networking platform designed to provide an interactive and secure environment for users to connect, share content, communicate, and explore AI-powered features. It combines modern social networking functionality with AI-powered assistance, insights, and content generation.

## 🚀 Features

### 👤 User & Authentication

* User registration and login using JWT authentication
* Secure password hashing with bcrypt
* User profile management
* Profile and cover photo updates
* Username, bio, location, followers and following

### 📱 Social Networking

* Create and publish text, image, and text-with-image posts
* Multiple images with individual captions
* Like and react to posts
* Comment and delete comments
* Share posts with connections
* Discover and connect with other users
* Follow and unfollow users
* Connection request management

### 📖 Stories

* Create and view stories
* 24-hour story expiration
* Story media support
* Interactive story viewing

### 💬 Messaging

* One-to-one messaging
* Image and document sharing
* Share posts directly through chat
* Recent conversations and user profiles

### 🤖 AI-Powered Features

* **AI Chatbot** for interactive AI-powered conversations
* AI-generated social media caption suggestions
* AI-assisted image/video caption generation
* **AI Personality Analysis** based on recent posts
* **AI Future Prediction** insights based on user activity
* Gemini-powered AI functionality
* Dedicated PingUpAI interface integrating multiple AI capabilities

### 📅 Additional Features

* Time Capsule posts with scheduled publishing
* Emoji support for comments and interactions
* Multiple post reactions
* Responsive user interface
* Image and media management using ImageKit
* Email functionality using Nodemailer
* Background/event processing using Inngest

## 🛠️ Technology Stack

### Frontend

* React 19
* Vite
* Redux Toolkit
* Tailwind CSS
* JavaScript
* Axios
* React Router
* Lucide React

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* bcryptjs
* Multer

### APIs & Services

* Gemini AI
* ImageKit
* Nodemailer
* Inngest

## 📂 Project Structure

```text
PingUp/
│
├── client/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── features/
│       ├── pages/
│       ├── api/
│       ├── App.jsx
│       └── main.jsx
│
├── server/
│   ├── configs/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── inngest/
│   ├── server.js
│   └── package.json
│
└── .gitignore
```

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/rachanav-21/PingUp_AI-Enhanced_Social_Media_Platform.git
```

```bash
cd PingUp_AI-Enhanced_Social_Media_Platform
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

### 3. Install backend dependencies

Open another terminal:

```bash
cd server
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `server` folder and configure the required values for:

* MongoDB
* JWT
* ImageKit
* Gemini AI
* Nodemailer
* Inngest

**Never commit your `.env` file or API keys to GitHub.**

### 5. Run the backend

From the `server` folder:

```bash
npm run server
```

### 6. Run the frontend

From the `client` folder:

```bash
npm run dev
```

## Security

PingUp uses:

* JWT-based authentication
* Password hashing with bcrypt
* Protected backend routes
* Environment variables for sensitive credentials
* `.gitignore` protection for `.env` and `node_modules`

## Project Highlights

* Full-stack AI-enhanced social media networking platform
* **6+ AI-powered features**
* AI chatbot for interactive conversations
* AI-generated caption suggestions
* AI personality analysis
* AI-based future prediction
* REST API-based client-server architecture
* Secure JWT authentication
* MongoDB-based data management
* Social networking, messaging, stories, reactions and post sharing
* AI-assisted social media experience

## Future Enhancements

* Real-time notifications using WebSockets
* Advanced AI recommendation system
* AI-powered content moderation
* Enhanced media processing
* Improved search and recommendation algorithms
* Mobile application support

## Developer

**V. Rachana**

MCA – Full Stack Web Development

**Skills:** Java | Python | JavaScript | React | Node.js | Express.js | MongoDB | AI/ML

## License

This project is developed for academic and educational purposes.
