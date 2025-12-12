## All Requirements Met

### 1. Setup Requirements
-  Credentials file present (`shopify_credentials.txt`)
-  Shopify shop + token exposed via environment variables (`config.ts`)

### 2. Microservice Requirements

####  GET /products?limit=x&cursor=xxx
- Implemented in `src/routes/products.ts`
- Returns array of products with correct format
- Supports cursor-based pagination
- Exposes `next_page` token in `X-Next-Page` header
- Products sorted by title (via GraphQL `sortKey: TITLE`)

####  GET /products/:id
- Implemented in `src/routes/products.ts`
- Returns single product with correct format
- Handles product IDs with special characters (gid://shopify/Product/...)

#### GET /api-stats
-  Implemented in `src/routes/stats.ts`
-  Returns aggregated latency summary with all required fields:
  - `endpoint_response_times_ms` (average, max, min)
  - `total_endpoint_calls`
  - `average_shopify_call_responsetime_ms`
  - `total_shopify_api_calls`

### 3. Key Architectural Requirements

####   Latency (<50ms response time)
-   Redis caching implemented (`src/services/cacheService.ts`)
-   Cache-first strategy in `src/services/productService.ts`
-   Cache TTL configurable via environment variable

####   Scalability (Multiple Instances)
-   Distributed Redis cache (using Docker)
-   Redis runs in Docker container for easy deployment and scaling
-   Stateless service design
-   All instances share same Redis cache

####   Resilience (Rate Limiting)
-   Leaky Bucket algorithm implemented (`src/services/shopifyClient.ts`)
-   Tracks `available`, `restoreRate`, `maxAvailable`
-   Handles 429 errors with automatic retry
-   Updates rate limit state from Shopify throttle status

####   Data (Shopify GraphQL)
-   Uses Shopify GraphQL Admin API (`src/services/shopifyClient.ts`)
-   Uses provided credentials from config
-   Proper GraphQL queries for products

### 4. Technical Expectations

####   HTTP Client
-   Uses `axios` for HTTP requests (`src/services/shopifyClient.ts`)

####   Shopify API
-   Uses Shopify GraphQL Admin API (not REST)
-   GraphQL queries in `shopifyClient.ts`

####   SDK Methods
-   `getProducts(limit?: number, cursor?: string): Promise<ProductResponse>`
-   `getProductById(id: string): Promise<Product>`
-   `getStats(): Promise<ProductStats>`
-   All methods implemented in `sdk/src/index.ts`

### 5. Additional Features (Production-Ready)
-   Error handling
-   TypeScript types
-   Health check endpoint (`/health`)
-   Graceful shutdown
-   Stats tracking middleware

## Project Structure
```
LuckyOrange/
├── src/                    # Microservice source code
│   ├── index.ts           # Express server
│   ├── config.ts          # Configuration (env vars)
│   ├── routes/            # API endpoints
│   ├── services/          # Business logic
│   └── middleware/        # Request middleware
├── sdk/                   # SDK package
│   └── src/              # SDK source code
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── README.md            # Assignment requirements
```

# Quick Start Guide

## Prerequisites
- Node.js (v18 or higher)
- Docker (for Redis) OR Redis installed locally

## Complete Setup & Run

### 1. Install Dependencies
```bash
cd /path/to/LuckyOrange
npm install
```

### 2. Start Redis with Docker

#### Option A: Start Redis Container (if already exists)
```bash
docker start redis
```

#### Option B: Create and Start Redis Container (first time)
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

#### Option C: Check if Redis is Running
```bash
docker ps | grep redis
```

#### Option D: If Redis container doesn`t exist, create it
```bash
# Remove old container if exists
docker rm -f redis 2>/dev/null || true

# Create and start new Redis container
docker run -d -p 6379:6379 --name redis redis:alpine

# Verify Redis is running
docker ps | grep redis
```

#### Alternative: Use Local Redis (if installed)
```bash
redis-server
```

### 3. Build the Project
```bash
npm run build
```

### 4. Start the Server
```bash
npm start
```

### Or use the startup script
```bash
./start.sh
```

The server will start on `http://localhost:3000`

## Development Mode (with auto-reload)

**Note:** Make sure Redis is running before starting dev mode.

```bash
# Start Redis (if not already running)
docker start redis || docker run -d -p 6379:6379 --name redis redis:alpine

# Start dev server
npm run dev
```

## Troubleshooting

### Redis Connection Issues
```bash
# Check if Redis container is running
docker ps | grep redis

# Check Redis logs
docker logs redis

# Restart Redis container
docker restart redis

# Test Redis connection
redis-cli ping
# Should return: PONG
```

### Port 3000 Already in Use
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm start
```

### Docker Not Running
```bash
# Start Docker Desktop (macOS/Windows)
# Or start Docker service (Linux)
sudo systemctl start docker
```

## Test the API

### Health Check
```bash
curl http://localhost:3000/health
```

### Get Products (First Page)
```bash
curl `http://localhost:3000/products?limit=5`
```

### Get Products with Cursor (Next Page)
```bash
# Use the cursor from X-Next-Page header of previous response
curl `http://localhost:3000/products?limit=5&cursor=eyJsYXN0X2lkIjo5NTc3...`
```

### Get Single Product
```bash
curl `http://localhost:3000/products/gid://shopify/Product/9435036647654`
```

### Get Stats
```bash
curl http://localhost:3000/api-stats
```

## Environment Variables (Optional)

Create a `.env` file to override defaults:
```
SHOPIFY_SHOP=luckyorange-interview-test.myshopify.com
SHOPIFY_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
CACHE_TTL=300
```

## SDK Usage

### Build SDK
```bash
cd sdk
npm install
npm run build
```

### Use SDK 
```typescript
import ShopifyProductSDK from `./sdk/src/index`;

const sdk = new ShopifyProductSDK(`http://localhost:3000`);

// Get first page
const result = await sdk.getProducts(10);
console.log(result.products);
console.log(result.next_page); // Use this cursor for next page

// Get next page using cursor
const nextPage = await sdk.getProducts(10, result.next_page);

// Get single product
const product = await sdk.getProductById(`gid://shopify/Product/123`);

// Get stats
const stats = await sdk.getStats();
```

