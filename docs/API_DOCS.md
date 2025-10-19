# MagicLens API Documentation

## Authentication API

### POST /api/auth/flow/login

Authenticate with Flow wallet signature and receive JWT token.

**Request Body:**
```json
{
  "wallet_address": "string",
  "signature": "string",
  "message": "string"
}
```

**Response:**
```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

**Description:**
This endpoint verifies the Flow wallet signature and generates a JWT token for authenticated API access.

### POST /api/user_service/create_user_profile

Create a new user profile.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `username` (string, required)
- `user_type` (string, required) - "videographer", "artist", or "both"
- `bio` (string, optional)
- `avatar` (file, optional)

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "username": "string",
  "user_type": "string",
  "avatar_url": "string|null",
  "bio": "string|null",
  "portfolio_data": "json|null",
  "earnings_total": "number",
  "is_verified": "boolean",
  "created_at": "datetime",
  "last_updated": "datetime"
}
```

### POST /api/user_service/get_user_profile

Get the current user's profile.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "username": "string",
  "user_type": "string",
  "avatar_url": "string|null",
  "bio": "string|null",
  "portfolio_data": "json|null",
  "earnings_total": "number",
  "is_verified": "boolean",
  "created_at": "datetime",
  "last_updated": "datetime"
}
```

## Video Service API

### POST /api/video_service/upload_video

Upload a new video.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (string, required)
- `description` (string, optional)
- `category` (string, optional)
- `video` (file, required)
- `thumbnail` (file, optional)

### POST /api/video_service/get_videos

Get a list of videos.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "limit": "number",
  "offset": "number"
}
```

## Asset Service API

### POST /api/asset_service/upload_asset

Upload a new AR asset.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `name` (string, required)
- `asset_type` (string, required)
- `category` (string, optional)
- `asset` (file, required)
- `thumbnail` (file, optional)

### POST /api/asset_service/get_assets

Get a list of assets.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "limit": "number",
  "offset": "number"
}
```

## Error Responses

All API endpoints return the following error format when an error occurs:

```json
{
  "error": "string",
  "message": "string",
  "details": "object|array|null"
}
```

## Authentication Errors

- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions