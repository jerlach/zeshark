# API Integration

This document covers connecting Zeshark to your backend API.

## Overview

Zeshark supports two data sources:

| Source | Transport | Best For |
|--------|-----------|----------|
| **JSON** | REST API (axios) | Small-medium datasets, full CRUD |
| **Parquet** | Binary file (DuckDB) | Large datasets, analytics |

---

## Configuration

### Environment Variables

```env
# Required: Your API base URL
VITE_API_URL=https://api.example.com

# Optional: Development auth token (bypasses localStorage lookup)
VITE_API_TOKEN=your-dev-token-here
```

### API Client

The axios client is configured in `src/api/client.ts`:

```typescript
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - adds auth token
apiClient.interceptors.request.use((config) => {
  const token = import.meta.env.VITE_API_TOKEN ?? localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor - handles errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

---

## JSON API Requirements

For `dataSource: 'json'` resources, your API should implement standard REST endpoints.

### Required Endpoints

```
GET    /api/{resource}          List all (or paginated)
GET    /api/{resource}/:id      Get single record
POST   /api/{resource}          Create record
PUT    /api/{resource}/:id      Update record
DELETE /api/{resource}/:id      Delete record
```

### Example: Customers API

```
GET    /api/customers           → List customers
GET    /api/customers/123       → Get customer 123
POST   /api/customers           → Create customer
PUT    /api/customers/123       → Update customer 123
DELETE /api/customers/123       → Delete customer 123
```

### Response Formats

#### List Response

```json
// GET /api/customers
{
  "data": [
    { "id": "1", "name": "John Doe", "email": "john@example.com" },
    { "id": "2", "name": "Jane Doe", "email": "jane@example.com" }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 25
  }
}
```

Or simply an array:

```json
// GET /api/customers
[
  { "id": "1", "name": "John Doe", "email": "john@example.com" },
  { "id": "2", "name": "Jane Doe", "email": "jane@example.com" }
]
```

#### Single Record Response

```json
// GET /api/customers/1
{
  "id": "1",
  "name": "John Doe",
  "email": "john@example.com",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### Create/Update Request

```json
// POST /api/customers
// PUT /api/customers/1
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

#### Create/Update Response

Return the created/updated record:

```json
{
  "id": "1",
  "name": "John Doe",
  "email": "john@example.com",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### Error Response

```json
// 400 Bad Request
{
  "message": "Validation failed",
  "errors": {
    "email": ["Invalid email format"],
    "name": ["Name is required"]
  }
}

// 404 Not Found
{
  "message": "Customer not found"
}

// 500 Server Error
{
  "message": "Internal server error"
}
```

---

## Parquet API Requirements

For `dataSource: 'parquet'` resources, your API serves parquet files.

### Required Endpoint

```
GET /api/{resource}?format=parquet → Returns binary .parquet file
```

### Example: Orders Parquet API

```
GET /api/orders?format=parquet
```

Response:
- Content-Type: `application/octet-stream` or `application/vnd.apache.parquet`
- Body: Binary parquet file

### Generating Parquet Files

Your backend should:

1. Query your database
2. Convert results to parquet format
3. Return the binary file

Example (Python/FastAPI):

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import pyarrow as pa
import pyarrow.parquet as pq
import io

app = FastAPI()

@app.get("/api/orders")
async def get_orders(format: str = "json"):
    # Query your database
    orders = await db.query("SELECT * FROM orders")
    
    if format == "parquet":
        # Convert to parquet
        table = pa.Table.from_pylist(orders)
        buffer = io.BytesIO()
        pq.write_table(table, buffer)
        buffer.seek(0)
        
        return StreamingResponse(
            buffer,
            media_type="application/octet-stream",
            headers={"Content-Disposition": "attachment; filename=orders.parquet"}
        )
    
    return {"data": orders}
```

Example (Node.js):

```typescript
import { parquetWrite } from 'hyparquet'

app.get('/api/orders', async (req, res) => {
  const orders = await db.query('SELECT * FROM orders')
  
  if (req.query.format === 'parquet') {
    const buffer = await parquetWrite({ data: orders })
    res.setHeader('Content-Type', 'application/octet-stream')
    res.send(buffer)
    return
  }
  
  res.json({ data: orders })
})
```

### Parquet Schema Considerations

Ensure your parquet schema matches your Zod schema:

| Zod Type | Parquet Type |
|----------|--------------|
| `z.string()` | UTF8 |
| `z.number()` | DOUBLE or INT64 |
| `z.boolean()` | BOOLEAN |
| `z.string().datetime()` | TIMESTAMP |
| `z.enum([...])` | UTF8 |

---

## Authentication

### Token-Based Auth

The default setup uses Bearer tokens:

```typescript
// Stored in localStorage
localStorage.setItem('auth_token', 'your-jwt-token')

// Sent with every request
Authorization: Bearer your-jwt-token
```

### Login Flow

Implement a login page that:

1. Calls your auth endpoint
2. Stores the token
3. Redirects to the app

```typescript
// src/routes/login.tsx
async function handleLogin(email: string, password: string) {
  const response = await apiClient.post('/auth/login', { email, password })
  localStorage.setItem('auth_token', response.data.token)
  navigate('/customers')
}
```

### Logout

```typescript
function handleLogout() {
  localStorage.removeItem('auth_token')
  window.location.href = '/login'
}
```

### Custom Auth Headers

Modify the interceptor for different auth schemes:

```typescript
// API Key auth
apiClient.interceptors.request.use((config) => {
  config.headers['X-API-Key'] = import.meta.env.VITE_API_KEY
  return config
})

// Session/cookie auth (no header needed)
apiClient.defaults.withCredentials = true
```

### Multi-Tenant Headers

Add tenant headers if needed:

```typescript
apiClient.interceptors.request.use((config) => {
  const tenantId = localStorage.getItem('tenant_id')
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId
  }
  return config
})
```

---

## Customizing API Paths

### Override Base Path

Per-resource API path:

```typescript
defineResource({
  name: 'customer',
  apiBasePath: '/v2/customers',  // Instead of /api/customers
})
```

### Custom Collection Sync

Override how data is fetched:

```typescript
// src/collections/customers.collection.ts
export const customersCollection = new Collection({
  name: 'customers',
  sync: {
    fetchAll: async () => {
      // Custom API call
      const response = await apiClient.get('/custom/endpoint')
      return transformData(response.data)
    },
    fetchOne: async (id) => {
      const response = await apiClient.get(`/custom/endpoint/${id}`)
      return transformData(response.data)
    },
  },
})
```

### Custom Mutations

Override create/update/delete:

```typescript
// In your route component
const createCustomer = useMutation({
  mutationFn: async (data) => {
    // Custom create logic
    const response = await apiClient.post('/custom/create', {
      ...data,
      extra_field: 'value',
    })
    return response.data
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['customers'])
  },
})
```

---

## Error Handling

### Global Error Handler

The axios interceptor handles common errors:

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message ?? 'An error occurred'

    if (status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    } else if (status === 403) {
      // Forbidden
      toast.error('You do not have permission to perform this action')
    } else if (status === 404) {
      // Not found
      toast.error('Resource not found')
    } else if (status >= 500) {
      // Server error
      toast.error('Server error. Please try again later.')
    } else if (status >= 400) {
      // Client error
      toast.error(message)
    }

    return Promise.reject(error)
  }
)
```

### Form Validation Errors

Handle validation errors in forms:

```typescript
const createMutation = useMutation({
  mutationFn: async (data) => {
    return apiClient.post('/customers', data)
  },
  onError: (error) => {
    if (error.response?.status === 400) {
      const errors = error.response.data.errors
      // Set form errors
      Object.entries(errors).forEach(([field, messages]) => {
        form.setFieldMeta(field, {
          errors: messages,
        })
      })
    }
  },
})
```

---

## Caching

### TanStack Query Caching

Configure cache behavior:

```typescript
// src/lib/query-client.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      gcTime: 30 * 60 * 1000,    // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
```

### Parquet Caching

Parquet files are cached in memory:

```typescript
// Force refresh parquet data
import { invalidateParquetCache } from '@/lib/duckdb-client'

invalidateParquetCache('/api/orders')  // Clear cache for this endpoint
```

### Manual Cache Invalidation

```typescript
// Invalidate specific queries
queryClient.invalidateQueries(['customers'])

// Invalidate all queries
queryClient.invalidateQueries()

// Remove from cache entirely
queryClient.removeQueries(['customers'])
```

---

## Pagination

### Server-Side Pagination

Your API should support pagination params:

```
GET /api/customers?page=1&per_page=25
GET /api/customers?offset=0&limit=25
```

Response with pagination metadata:

```json
{
  "data": [...],
  "meta": {
    "total": 1000,
    "page": 1,
    "per_page": 25,
    "total_pages": 40
  }
}
```

### Client-Side (Parquet)

For parquet resources, pagination happens client-side via DuckDB:

```typescript
const { data, page, totalPages, nextPage, prevPage } = useDuckDBQuery({
  queryKey: ['orders'],
  baseUrl: '/api/orders',
  pageSize: 50,
  page: 0,
})
```

---

## Filtering & Sorting

### Server-Side (JSON)

Pass filters and sort as query params:

```
GET /api/customers?status=active&sort=name&order=asc
```

### Client-Side (Parquet)

For parquet, filters are SQL WHERE clauses:

```typescript
const { data } = useDuckDBQuery({
  queryKey: ['orders'],
  baseUrl: '/api/orders',
  where: "status = 'pending' AND total > 100",
  orderBy: 'created_at DESC',
})
```

---

## Real-Time Updates

### Polling

Simple approach using TanStack Query:

```typescript
const { data } = useQuery({
  queryKey: ['customers'],
  queryFn: fetchCustomers,
  refetchInterval: 30000,  // Poll every 30 seconds
})
```

### WebSocket Integration

For real-time updates:

```typescript
// src/lib/websocket.ts
const ws = new WebSocket('wss://api.example.com/ws')

ws.onmessage = (event) => {
  const { type, resource, data } = JSON.parse(event.data)
  
  if (type === 'update') {
    // Update TanStack DB collection
    const collection = getCollection(resource)
    collection.upsert(data)
  }
  
  if (type === 'delete') {
    const collection = getCollection(resource)
    collection.delete(data.id)
  }
}
```

---

## CORS Configuration

Your API must allow CORS from your frontend domain:

```
Access-Control-Allow-Origin: https://your-app.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

For development:

```
Access-Control-Allow-Origin: http://localhost:5173
```

---

## Testing API Integration

### Mock API (MSW)

Use Mock Service Worker for testing:

```typescript
// src/mocks/handlers.ts
import { rest } from 'msw'

export const handlers = [
  rest.get('/api/customers', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: '1', name: 'Test Customer', email: 'test@example.com' },
      ])
    )
  }),
]
```

### Development Proxy

Configure Vite proxy for development:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

---

## Troubleshooting

### Common Issues

**401 Unauthorized**
- Check token is being sent
- Verify token format (Bearer prefix)
- Check token expiration

**CORS Errors**
- Verify API CORS configuration
- Check origin header matches

**Parquet Load Failures**
- Verify endpoint returns binary parquet
- Check Content-Type header
- Ensure auth headers are sent

### Debug Mode

Enable axios request logging:

```typescript
apiClient.interceptors.request.use((config) => {
  console.log('Request:', config.method, config.url, config.headers)
  return config
})

apiClient.interceptors.response.use(
  (response) => {
    console.log('Response:', response.status, response.data)
    return response
  },
  (error) => {
    console.error('Error:', error.response?.status, error.response?.data)
    return Promise.reject(error)
  }
)
```
