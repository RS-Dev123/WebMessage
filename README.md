# WebMessage — Real-Time Chat Application

**WebMessage** is a full-stack real-time messaging web application built using React, Node.js, Express, MongoDB, and Socket.IO.

I developed this project to explore full-stack web development, real-time communication, authentication, database management, and media handling.

The application allows users to connect through unique user IDs, exchange messages, share images and videos, post temporary statuses, and customize their chatting experience.

### Live Demo

**[WebMessage — Live Application](https://webmessage-zfpl.onrender.com/)**


## Features

###  User Authentication
- User sign-up and sign-in using Clerk
- Authenticated API access
- User profile synchronization with MongoDB

### Real-Time Messaging
- One-to-one conversations
- Real-time message delivery using Socket.IO
- Text, image, and video messages
- Conversation history
- Recent conversations displayed in the sidebar
- Option to hide conversations individually without deleting the other user's messages

###  User Discovery
- Unique public user IDs (WM-...)
- Search for users using their exact IDs
- Follow and unfollow functionality
- Followers and following management

###  Online Presence
- Online user status
- Real-time presence updates using Socket.IO

### Status Sharing
- Share text, images, and videos as statuses
- Statuses expire after 24 hours
- View statuses from followers and followed users

###  UI Customization
- Light and dark themes
- Multiple accent-color options
- Custom chat wallpapers
- Responsive interface for desktop and mobile screens
- Loading states and empty-state messages

###  Media Management
- Image and video uploads
- Media storage using ImageKit
- Media previews and downloads
- File upload size limit of 25 MiB

---

##  Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React 19, JavaScript, Vite 8 |
| Styling | Tailwind CSS 4, HeroUI |
| Routing | React Router |
| State Management | Zustand, React Context API |
| Backend | Node.js 22, Express.js 5 |
| Database | MongoDB, Mongoose |
| Real-Time Communication | Socket.IO |
| Authentication | Clerk |
| Media Storage | ImageKit |
| API Communication | Axios |
| File Uploads | Multer |
| Icons & Notifications | Lucide React, React Hot Toast |
| Deployment | Docker, Render |
| Code Quality | ESLint |

---

##  Application Architecture

WebMessage follows a client-server architecture.

**Frontend (React)**
- Handles the user interface and navigation
- Manages chat state using Zustand
- Communicates with the backend through Axios
- Connects to Socket.IO for real-time events

**Backend (Node.js + Express)**
- Provides REST APIs for users, messages, and statuses
- Validates authenticated requests through Clerk
- Handles messaging operations and media uploads
- Manages real-time communication through Socket.IO

**Database (MongoDB)**
- Stores user information
- Maintains message history
- Stores follow relationships and statuses

**ImageKit**
- Stores uploaded images and videos
- Provides media delivery and transformations

---

##  How WebMessage Works

1. A user signs in through Clerk.
2. The backend verifies the authenticated user and retrieves or creates their MongoDB profile.
3. The user searches for another user using their unique WebMessage ID.
4. Users can follow each other and start direct conversations.
5. Messages are saved in MongoDB.
6. Socket.IO delivers new-message events to connected recipients.
7. ImageKit handles uploaded images and videos.
8. Users can also share temporary statuses and customize their chat interface.

---

##  Getting Started

### Prerequisites

Make sure the following are available:

- Node.js 22
- npm
- MongoDB database
- Clerk application credentials
- ImageKit account credentials

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd <repository-folder>
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create the required environment files using the configuration expected by the project.

The application requires configuration for:

- MongoDB connection
- Clerk authentication and webhook verification
- ImageKit media storage
- Backend server port
- Frontend origin
- Vite Clerk publishable key

**Important:** Do not commit `.env` files, API secrets, database credentials, or private keys to GitHub.

### 4. Start the Backend

From the `backend` directory:

```bash
npm run dev
```

### 5. Install and Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server will display its local URL.

The frontend is configured to use the backend API at:

```text
http://localhost:3000/api
```

Make sure the backend is configured to use the corresponding development port.

---

##  Main API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/auth/check` | Get authenticated user |
| GET | `/api/messages/users/:publicId` | Search user by public ID |
| POST | `/api/messages/users/:id/follow` | Follow a user |
| DELETE | `/api/messages/users/:id/follow` | Unfollow a user |
| GET | `/api/messages/conversations` | Fetch conversations |
| DELETE | `/api/messages/conversations/:id` | Hide a conversation |
| GET | `/api/messages/:id` | Fetch messages |
| POST | `/api/messages/send/:id` | Send a message |
| GET | `/api/messages/statuses` | Fetch statuses |
| POST | `/api/messages/statuses` | Create a status |

Message-related API endpoints require authentication.

---

##  Deployment

WebMessage is deployed on **Render** using Docker.

The project uses a multi-stage Docker build:

1. Build the React frontend with Vite.
2. Prepare the Node.js backend.
3. Copy the frontend build into the backend's public directory.
4. Serve the API and frontend through Express in a single container.

**Live Website:** https://webmessage-zfpl.onrender.com/


---

##  Future Improvements

Some improvements I would like to explore include:

- Authenticated Socket.IO connections
- Improved support for multiple tabs and devices
- Automated unit and integration tests
- Message read receipts and delivery indicators
- Message search
- Improved frontend bundle size and loading performance
- Group messaging
- Additional accessibility improvements

---

##  Project Checks

The following frontend checks have been completed successfully:

- `npm run lint`
- `npm run build`

The production build currently reports a bundle-size warning, which can be improved through code splitting.

Automated test suites have not yet been configured.

---


**⭐ If you find this project interesting, consider giving the repository a star!**
