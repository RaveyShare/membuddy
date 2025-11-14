import uuid
from datetime import datetime, timedelta

users = {}
memory_items = {}
review_schedules = {}
shares = {}

def create_user(email: str, full_name: str, password: str):
    u = {"id": str(uuid.uuid4()), "email": email, "full_name": full_name or "", "password": password}
    users[email] = u
    return u

def get_or_create_user(email: str, password: str, full_name: str = ""):
    u = users.get(email)
    if not u:
        u = create_user(email, full_name, password)
    return u

def create_memory_item(user_id: str, payload: dict):
    item_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    item = {
        "id": item_id,
        "user_id": user_id,
        "title": payload.get("title") or (payload.get("content", "")[:50] or ""),
        "content": payload.get("content", ""),
        "category": payload.get("category", "其他"),
        "tags": payload.get("tags", []),
        "type": payload.get("type", "general"),
        "difficulty": payload.get("difficulty", "medium"),
        "mastery": payload.get("mastery", 0),
        "review_count": 0,
        "review_date": None,
        "next_review_date": None,
        "starred": payload.get("starred", False),
        "created_at": now,
        "updated_at": now,
        "memory_aids": payload.get("memory_aids"),
    }
    memory_items[item_id] = item
    create_default_schedule(item_id, user_id)
    return item

def create_default_schedule(item_id: str, user_id: str):
    days = [1, 3, 7, 14, 30]
    for d in days:
        sid = str(uuid.uuid4())
        rs = {
            "id": sid,
            "memory_item_id": item_id,
            "user_id": user_id,
            "review_date": (datetime.utcnow() + timedelta(days=d)).isoformat(),
            "completed": False,
            "created_at": datetime.utcnow().isoformat(),
        }
        review_schedules[sid] = rs
    return True