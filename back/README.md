# MemBuddy Backend

This is the backend service for MemBuddy, a memory aid generation and management application. It provides APIs for user authentication, memory aid generation, and review scheduling.

## Features

- User authentication and authorization
- Memory aid generation
- Memory item management
- Review scheduling system
- MySQL database integration

## Prerequisites

- Python 3.8+
- MySQL 8.0+
- Virtual environment (recommended)

## Setup

1. Create a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the root directory with the following variables:
```env
# API Settings
SECRET_KEY=your-secret-key-here

# Database
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=membuddy
```

4. Create the MySQL database:
```sql
CREATE DATABASE membuddy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. Initialize the database:
```bash
alembic upgrade head
```

## Running the Server

Development mode:
```bash
uvicorn main:app --reload
```

Production mode:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Documentation

Once the server is running, you can access the API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Authentication
- POST /api/auth/register - User registration
- POST /api/auth/login - User login

### Memory Management
- POST /api/memory/generate - Generate memory aids
- GET /api/memory/items - Get all memory items
- POST /api/memory/items - Create memory item
- GET /api/memory/items/{id} - Get specific memory item
- PUT /api/memory/items/{id} - Update memory item
- DELETE /api/memory/items/{id} - Delete memory item

### Review Management
- POST /api/review/schedule - Schedule review
- GET /api/review/schedule - Get review schedule

## Development

### Database Migrations

Create a new migration:
```bash
alembic revision --autogenerate -m "description"
```

Apply migrations:
```bash
alembic upgrade head
```

### Testing

Run tests:
```bash
pytest
```

## Project Structure

```
back/
├── alembic/              # Database migrations
├── main.py              # FastAPI application
├── models.py            # SQLAlchemy models
├── schemas.py           # Pydantic schemas
├── database.py          # Database connection
├── config.py            # Configuration
└── requirements.txt     # Dependencies
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
