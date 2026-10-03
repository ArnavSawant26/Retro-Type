import unittest

from pydantic import ValidationError

from schemas import ResultCreate, RoomCreate, UserCreate


class ValidationTests(unittest.TestCase):
    def test_registration_rejects_empty_credentials(self):
        with self.assertRaises(ValidationError):
            UserCreate(username="", email="qa@example.com", password="")

    def test_registration_requires_a_safe_username_and_password(self):
        with self.assertRaises(ValidationError):
            UserCreate(username="name with spaces", email="qa@example.com", password="password1")
        with self.assertRaises(ValidationError):
            UserCreate(username="valid_name", email="qa@example.com", password="short")

    def test_result_and_room_bounds_are_enforced(self):
        with self.assertRaises(ValidationError):
            ResultCreate(wpm=-1, accuracy=101, word_count=-1)
        with self.assertRaises(ValidationError):
            RoomCreate(max_players=99, mode_value=0)


if __name__ == "__main__":
    unittest.main()
