
from fastapi.testclient import TestClient
import pytest
import copy

from src.app import app, activities


# Capture the initial activities state so we can restore it between tests
_INITIAL_ACTIVITIES = copy.deepcopy(activities)


@pytest.fixture(autouse=True)
def reset_activities():
    """Reset the in-memory activities dict to the original snapshot for each test."""
    activities.clear()
    activities.update(copy.deepcopy(_INITIAL_ACTIVITIES))
    yield
    # ensure clean state after test as well
    activities.clear()
    activities.update(copy.deepcopy(_INITIAL_ACTIVITIES))


@pytest.fixture
def client():
    return TestClient(app)


def test_get_activities(client):
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # basic sanity checks
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]


def test_signup_and_unregister(client):
    activity = "Chess Club"
    email = "pytest_user@example.com"

    # Signup
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    # Confirm via GET
    data = client.get("/activities").json()
    assert email in data[activity]["participants"]

    # Duplicate signup should return 400
    resp_dup = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp_dup.status_code == 400

    # Unregister
    resp_del = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp_del.status_code == 200

    # Confirm removed
    data2 = client.get("/activities").json()
    assert email not in data2[activity]["participants"]


def test_unregister_nonexistent_returns_404(client):
    activity = "Chess Club"
    email = "this_email_does_not_exist@example.com"

    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 404
