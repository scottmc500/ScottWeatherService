import os
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional

# Environment variables
MONGODB_URI = os.getenv("MONGODB_URI")

# Global database connection
_database: Optional[AsyncIOMotorClient] = None

async def get_database():
    """Get database connection"""
    global _database
    
    if _database is None:
        if not MONGODB_URI:
            raise ValueError("MONGODB_URI environment variable is required")
        
        _database = AsyncIOMotorClient(MONGODB_URI)
        
        # Test the connection
        try:
            await _database.admin.command('ping')
            print("Connected to MongoDB successfully")
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")
            raise
    
    return _database

async def close_database():
    """Close database connection"""
    global _database
    
    if _database:
        _database.close()
        _database = None
        print("Disconnected from MongoDB")
