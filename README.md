# Forland Service Backend API

A comprehensive Node.js/Express backend API for managing banking website content, including menu categories, menu items, news, products, foreign exchange rates, and more.

## 🚀 Features

- **Menu Management**: Dynamic menu categories, subcategories, and menu items with banner image support
- **Content Management**: News, investor news, products, carousel items
- **Foreign Exchange**: Automated daily exchange rate updates via cron job (7:00 AM Tanzania time)
- **User Management**: JWT-based authentication and authorization
- **File Uploads**: Image and PDF upload support with organized storage
- **Board & Management**: Team member management for board of directors and management team
- **Contact Forms**: Application and contact form submissions
- **Wakala Locations**: Branch/agent location management
- **FAQs**: Frequently asked questions management

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## 🔧 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd forlandservice
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/forlandservice
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

PORT=5000
JWT_SECRET=your-secret-key-here
API_BASE_URL=https://service.mwalimubank.co.tz

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

4. Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## 📁 Project Structure

```
forlandservice/
├── models/              # Mongoose models
├── routes/              # API route handlers
├── middlewares/         # Authentication and other middlewares
├── utils/               # Utility functions (image URL building)
├── jobs/                # Cron jobs (foreign exchange sync)
├── scripts/             # Database seeding scripts
├── uploads/             # Uploaded files storage
│   ├── products/
│   ├── news-and-updates/
│   ├── menu-items/
│   ├── menu-categories/
│   └── ...
└── server.js            # Main server file
```

## 🔌 API Endpoints

### Authentication
- `POST /users/login` - User login
- `POST /users/register` - User registration (admin)

### Menu Categories
- `GET /menu-categories` - Get all active categories (public)
- `GET /menu-categories/all` - Get all categories with pagination (admin)
- `GET /menu-categories/:id` - Get single category
- `POST /menu-categories` - Create category (admin)
- `PUT /menu-categories/:id` - Update category (admin)
- `DELETE /menu-categories/:id` - Delete category (admin)
- `POST /menu-categories/upload-banner` - Upload subcategory banner image (admin)

### Menu Items
- `GET /menu-items` - Get menu items with filters (public)
- `GET /menu-items/route/:route` - Get items by route with subcategory banner (public)
- `GET /menu-items/:id` - Get single item
- `POST /menu-items` - Create item with banner upload (admin)
- `PUT /menu-items/:id` - Update item with banner upload (admin)
- `DELETE /menu-items/:id` - Delete item (admin)

### Foreign Exchange
- `GET /foreign-exchange` - Get all active rates (public)
- `POST /foreign-exchange/sync` - Manually sync rates from API (admin)
- *Automatic sync runs daily at 7:00 AM Tanzania time*

### Other Endpoints
- Products, News, Investor News, Carousel, Board of Directors, Management, FAQs, Contact, Applications, Wakala, etc.

## 🔄 Cron Jobs

### Foreign Exchange Rate Sync
- **Schedule**: Daily at 7:00 AM (Africa/Dar_es_Salaam timezone)
- **File**: `jobs/foreignExchangeCron.js`
- **Function**: Automatically fetches and updates exchange rates from external API
- **Currencies**: USD, EUR, GBP, KES, INR, AUD, CAD, CHF, JPY, CNY, ZAR, SAR

## 📦 Database Models

- **MenuCategory**: Menu categories with subcategories (supports banner images)
- **MenuItem**: Individual menu items with page content
- **ForeignExchange**: Currency exchange rates
- **Product**: Product listings
- **NewsAndUpdate**: News articles
- **InvestorNews**: Investor-related news
- **BoardOfDirector**: Board member profiles
- **Management**: Management team profiles
- **FAQ**: Frequently asked questions
- **Wakala**: Branch/agent locations
- **User**: Admin users

## 🗄️ Database Seeding

Seed initial data:
```bash
node scripts/seedMenuData.js
node scripts/seedFAQs.js
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

Default admin credentials (change in production):
- Username: `admin`
- Password: `password`

## 📤 File Uploads

Files are uploaded to the `uploads/` directory, organized by type:
- Images: JPG, PNG, etc.
- PDFs: For investor categories and documents

Upload endpoints accept `multipart/form-data` with file fields.

## 🌐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `PORT` | Server port (default: 5000) | No |
| `JWT_SECRET` | Secret for JWT tokens | Yes |
| `API_BASE_URL` | Base URL for file serving | Yes |

## 🚀 Deployment

1. Set environment variables on your server
2. Install dependencies: `npm install --production`
3. Start with PM2: `pm2 start server.js --name forland-api`
4. Or use Docker (see deployment guide)

## 📝 Notes

- The server uses `trust proxy` for correct URL generation behind reverse proxies
- Image URLs are built using `API_BASE_URL` environment variable
- Cron jobs start automatically after MongoDB connection
- All timestamps are in UTC

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Commit with descriptive messages
4. Push to your branch
5. Create a pull request

## 📄 License

ISC

## 👥 Support

For issues and questions, please contact the development team.

