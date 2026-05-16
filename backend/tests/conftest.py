import os

# Must be set before any app module is imported, because app/auth.py reads
# SECRET_KEY at module load time and raises RuntimeError if it is absent.
os.environ.setdefault("SECRET_KEY", "test-only-secret-key-not-for-production")
