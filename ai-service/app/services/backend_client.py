import httpx
from app.core.config import get_settings

settings = get_settings()


async def get_booking_status(booking_code: str, token: str) -> dict:
    """Gọi Spring Boot để lấy trạng thái đơn."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{settings.backend_url}/bookings/my",
                headers={"Authorization": f"Bearer {token}"}
            )
            if response.status_code == 200:
                return response.json()
            return {"error": "Không lấy được thông tin đơn"}
    except Exception as e:
        return {"error": str(e)}


async def search_cars(location: str = None, seats: int = None) -> dict:
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
                return response.json()
            return {"error": "Không tìm được xe"}
    except Exception as e:
        return {"error": str(e)}