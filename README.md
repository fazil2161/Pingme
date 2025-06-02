# PingMe - Social Media Dashboard

A full-stack social media dashboard application built with the MERN stack (MongoDB, Express.js, React, Node.js). PingMe allows users to register, log in, post updates, follow other users, like and comment on posts, and receive real-time notifications.

## 🌟 Features

### User Authentication
- ✅ User registration with profile picture upload
- ✅ Secure login with JWT authentication
- ✅ Refresh token implementation
- ✅ Password hashing with bcrypt
- ✅ Protected routes and authorization

### User Profiles
- ✅ Personal profile pages with bio, location, and website
- ✅ Profile picture uploads
- ✅ Edit profile functionality
- ✅ Follow/unfollow system
- ✅ Follower and following lists

### Posts and Feed
- ✅ Create posts with text (up to 280 characters)
- ✅ Image uploads for posts
- ✅ Personal news feed from followed users
- ✅ Like and unlike posts
- ✅ Comment system with nested replies
- ✅ Post editing and deletion
- ✅ Retweet functionality

### Real-time Features
- ✅ Socket.io integration for real-time notifications
- ✅ Live notifications for likes, comments, follows
- ✅ User online/offline status
- ✅ Real-time feed updates

### Search and Discovery
- ✅ Hashtag-based search (#coding, #mern)
- ✅ User search functionality
- ✅ Trending hashtags
- ✅ Suggested users to follow
- ✅ Infinite scroll pagination

### Security and Performance
- ✅ Rate limiting
- ✅ Helmet for security headers
- ✅ CORS configuration
- ✅ Input validation and sanitization
- ✅ MongoDB indexing for performance
- ✅ Image compression and optimization

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **Multer** - File uploads
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **Helmet** - Security middleware
- **express-rate-limit** - Rate limiting
- **Compression** - Response compression

### Frontend
- **React** - UI library
- **React Router DOM** - Routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Socket.io-client** - Real-time client
- **React Hook Form** - Form handling
- **Headless UI** - Accessible components
- **Heroicons** - Icon library

### Development Tools
- **Nodemon** - Development server
- **Concurrently** - Run multiple commands
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pingme
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Configuration**
   
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/pingme
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this_in_production
   JWT_EXPIRE=7d
   JWT_REFRESH_EXPIRE=30d
   CLIENT_URL=http://localhost:3000
   SERVER_URL=http://localhost:5000
   NODE_ENV=development
   ```

5. **Start MongoDB**
   
   Make sure MongoDB is running on your system:
   ```bash
   # For local MongoDB installation
   mongod
   
   # Or use MongoDB Atlas cloud database
   # Update MONGO_URI in .env file with your Atlas connection string
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```
   
   The server will start on `http://localhost:5000`

2. **Start the frontend application**
   ```bash
   cd client
   npm start
   ```
   
   The React app will start on `http://localhost:3000`

3. **Access the application**
   
   Open your browser and navigate to `http://localhost:3000`

## 📁 Project Structure

```
pingme/
├── server/                 # Backend application
│   ├── config/            # Database configuration
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── socket/           # Socket.io handlers
│   ├── uploads/          # File uploads directory
│   ├── utils/            # Utility functions
│   ├── .env              # Environment variables
│   ├── package.json      # Backend dependencies
│   └── server.js         # Main server file
├── client/               # Frontend application
│   ├── public/          # Public assets
│   ├── src/             # React source code
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom hooks
│   │   ├── context/     # React context
│   │   ├── utils/       # Utility functions
│   │   ├── services/    # API services
│   │   └── styles/      # Custom styles
│   ├── package.json     # Frontend dependencies
│   └── tailwind.config.js # Tailwind configuration
└── README.md            # Project documentation
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/change-password` - Change password

### Users
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/:userId/follow` - Follow a user
- `POST /api/users/:userId/unfollow` - Unfollow a user
- `GET /api/users/:userId/followers` - Get user followers
- `GET /api/users/:userId/following` - Get user following
- `GET /api/users/search` - Search users
- `GET /api/users/suggestions` - Get suggested users

### Posts
- `POST /api/posts` - Create a new post
- `GET /api/posts/feed` - Get user feed
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/comment` - Comment on post
- `POST /api/posts/:id/retweet` - Retweet post
- `GET /api/posts/search` - Search posts
- `GET /api/posts/trending` - Get trending hashtags

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## 🎨 UI Features

### Design System
- Modern, clean interface inspired by Twitter/X
- Dark mode support
- Responsive design for all devices
- Custom Tailwind CSS components
- Smooth animations and transitions

### Components
- Reusable UI components
- Form validation with React Hook Form
- Toast notifications
- Modal dialogs
- Loading states and skeletons
- Infinite scroll implementation

### User Experience
- Fast and responsive interface
- Real-time updates without page refresh
- Optimistic UI updates
- Error handling and user feedback
- Accessibility features

## 🔐 Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt (cost factor 12)
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration
- Helmet for security headers
- File upload validation and size limits
- XSS protection

## 📊 Performance Optimizations

- MongoDB indexing for fast queries
- Image compression and optimization
- Response compression with gzip
- Efficient pagination
- Connection pooling
- Caching strategies
- Lazy loading for images

## 🧪 Testing

### Backend Testing
```bash
cd server
npm test
```

### Frontend Testing
```bash
cd client
npm test
```

## 🚀 Deployment

### Development - Running Both Server and Client

To run both the server and client from a single command:

```bash
# Install all dependencies
npm run install-all

# Start both server and client concurrently
npm run dev
# or alternatively
npm run start:both
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend client on `http://localhost:3000`

### Production Deployment on Render (Single Web Service)

This application is configured to deploy as a single web service on Render, where the Express server serves both the API and the built React client.

#### Option 1: Using render.yaml (Recommended)

1. Fork/clone this repository
2. Connect your GitHub repository to Render
3. The `render.yaml` file will automatically configure the deployment
4. Set the following environment variables in Render dashboard:
   - `MONGO_URI` - Your MongoDB connection string
   - `JWT_SECRET` - A secure secret for JWT tokens
   - `NODE_ENV` - Set to `production`

#### Option 2: Manual Setup

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the following settings:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Node Version**: 18 or higher
4. Set environment variables as mentioned above

#### How it works in Production

- The build process installs dependencies for both server and client
- The client React app is built with `REACT_APP_API_URL=/api` 
- The Express server serves the built React files for all non-API routes
- API routes are available at `/api/*`
- The entire application runs on a single port

### Alternative Deployment Options

#### Backend Deployment (Railway/Heroku)
1. Create an account on Railway or Heroku
2. Connect your repository
3. Set environment variables
4. Deploy using Git integration

#### Frontend Deployment (Vercel/Netlify)
1. Build the client with development API URL
2. Connect your GitHub repository
3. Configure build settings
4. Deploy automatically on push

#### Database (MongoDB Atlas)
1. Create a MongoDB Atlas cluster
2. Configure network access (allow all IPs for Render: 0.0.0.0/0)
3. Update MONGO_URI in environment variables

### Environment Variables

Create a `.env` file in the server directory with:

```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/pingme

# JWT
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key

# Server
PORT=5000
NODE_ENV=production

# Optional: File uploads (for cloud storage)
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **PingMe Team** - *Initial work*

## 🙏 Acknowledgments

- React community for excellent documentation
- Express.js team for the robust framework
- MongoDB team for the powerful database
- Tailwind CSS for the utility-first CSS framework
- Socket.io team for real-time communication

## 🐛 Known Issues

- Image uploads are currently stored locally (consider cloud storage for production)
- Email verification is not yet implemented
- Push notifications for mobile are not implemented

## 🔮 Future Enhancements

- [ ] Email verification system
- [ ] Password reset functionality
- [ ] Push notifications
- [ ] Video uploads
- [ ] Stories feature
- [ ] Advanced search filters
- [ ] Admin dashboard
- [ ] Analytics and insights
- [ ] Mobile app (React Native)
- [ ] Progressive Web App (PWA)

## 📞 Support

If you have any questions or need help with setup, please create an issue in the repository or contact the development team.

---

**Happy coding! 🚀** 