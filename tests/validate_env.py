import requests
import time
import sys

def check_service(name, url, expected_status=200):
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == expected_status:
            print(f"✅ {name} is UP ({url})")
            return True
        else:
            print(f"⚠️ {name} is UP but returned status {response.status_code} ({url})")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ {name} is DOWN ({url})")
        return False

def main():
    print("🚀 Starting Environment Validation...")
    print("-" * 40)
    
    # Check Backend
    backend_ok = check_service("Backend", "http://localhost:8000/health")
    
    # Check Frontend
    frontend_ok = check_service("Frontend", "http://localhost:3000")
    
    # Note: Updater doesn't have an HTTP port exposed by default in compose
    # so we just assume if others are up and containers started, it's ok for now.
    
    print("-" * 40)
    if backend_ok and frontend_ok:
        print("✨ Environment is looking good!")
        sys.exit(0)
    else:
        print("❌ Some services are not responding correctly.")
        print("Tips: Check if 'docker-compose up' is running and you have filled your .env file.")
        sys.exit(1)

if __name__ == "__main__":
    main()
