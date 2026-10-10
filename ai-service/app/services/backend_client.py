import httpx
from app.core.config import get_settings

settings = get_settings()


async def get_my_bookings(token: str) -> list:
    """Gọi Spring Boot để lấy danh sách đơn của user (cần JWT)."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{settings.backend_url}/bookings/my",
                headers={"Authorization": f"Bearer {token}"}
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("data", [])
            return {"error": f"HTTP {response.status_code}"}
    except Exception as e:
        return {"error": str(e)}


async def search_cars(location: str = None, seats: int = None) -> list:
    """Gọi Spring Boot để tìm xe."""
    try:
        params = {}
        if location:
            params["location"] = location
        if seats:
            params["seats"] = seats

        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{settings.backend_url}/cars",
                params=params
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("data", [])
            return {"error": f"HTTP {response.status_code}"}
    except Exception as e:
        return {"error": str(e)}


async def get_booking_status(booking_id: int, token: str) -> dict:
    """Lấy chi tiết 1 đơn."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{settings.backend_url}/bookings/{booking_id}",
                headers={"Authorization": f"Bearer {token}"}
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("data", {})
            return {"error": f"HTTP {response.status_code}"}
    except Exception as e:
        return {"error": str(e)}


async def get_owner_bookings(token: str) -> list:
    """Lấy danh sách đơn hàng của chủ xe (cần JWT role OWNER)."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{settings.backend_url}/bookings/owner",
                headers={"Authorization": f"Bearer {token}"}
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("data", [])
            return {"error": f"HTTP {response.status_code}"}
    except Exception as e:
        return {"error": str(e)}


async def get_admin_stats(token: str) -> dict:
    """Lấy số liệu tổng quan Dashboard của Admin (cần JWT role ADMIN)."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{settings.backend_url}/admin/dashboard/stats",
                headers={"Authorization": f"Bearer {token}"}
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("data", {})
            return {"error": f"HTTP {response.status_code}"}
    except Exception as e:
        return {"error": str(e)}