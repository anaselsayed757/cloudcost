"""
Unit tests for authentication utilities — password hashing and JWT tokens.

Uses passlib and python-jose directly so these tests run without FastAPI
or a database. The same logic lives in app/auth.py.
"""
import os
import pytest
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext

SECRET_KEY = os.environ["SECRET_KEY"]
ALGORITHM  = "HS256"

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(hours=24)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


class TestPasswordHashing:

    def test_hash_is_not_plaintext(self):
        hashed = hash_password("mysecretpassword")
        assert hashed != "mysecretpassword"

    def test_correct_password_verifies(self):
        hashed = hash_password("correct-password")
        assert verify_password("correct-password", hashed) is True

    def test_wrong_password_fails(self):
        hashed = hash_password("correct-password")
        assert verify_password("wrong-password", hashed) is False

    def test_empty_password_hashes_and_verifies(self):
        hashed = hash_password("")
        assert verify_password("", hashed) is True
        assert verify_password("not-empty", hashed) is False

    def test_two_hashes_of_same_password_are_different(self):
        """Hashing uses a random salt — each call produces a unique hash."""
        h1 = hash_password("same-password")
        h2 = hash_password("same-password")
        assert h1 != h2

    def test_both_hashes_still_verify(self):
        h1 = hash_password("same-password")
        h2 = hash_password("same-password")
        assert verify_password("same-password", h1) is True
        assert verify_password("same-password", h2) is True


class TestJwtToken:

    def test_token_contains_username(self):
        token   = create_token({"sub": "alice", "role": "admin"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "alice"

    def test_token_contains_role(self):
        token   = create_token({"sub": "bob", "role": "viewer"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["role"] == "viewer"

    def test_token_has_expiry(self):
        token   = create_token({"sub": "alice"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert "exp" in payload

    def test_token_invalid_with_wrong_secret(self):
        token = create_token({"sub": "alice"})
        with pytest.raises(JWTError):
            jwt.decode(token, "wrong-secret", algorithms=[ALGORITHM])

    def test_different_users_get_different_tokens(self):
        t1 = create_token({"sub": "alice"})
        t2 = create_token({"sub": "bob"})
        assert t1 != t2
