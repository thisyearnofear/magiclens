"""Tests for collaboration request functionality (send, list, respond)."""
import sys
import types
import uuid
from unittest.mock import patch
from datetime import datetime
import pytest
import core
import core.database  # noqa: F401 - ensure patch("core.database...") can resolve submodule
from core.user import User

for module_name in ("core.recommendation_engine", "core.ai_analysis_service"):
    module = types.ModuleType(module_name)
    sys.modules.setdefault(module_name, module)
    setattr(core, module_name.rsplit(".", 1)[-1], module)


MOCK_USER = User(
    id=uuid.uuid4(),
    wallet_address="0x1234567890abcdef",
)

MOCK_SENDER_PROFILE = {
    "id": uuid.uuid4(),
    "username": "test_artist",
}

MOCK_TARGET_PROFILE = {
    "id": uuid.uuid4(),
    "username": "test_videographer_1",
}

MOCK_ANOTHER_PROFILE = {
    "id": uuid.uuid4(),
    "username": "test_videographer_2",
}


class TestSendCollaborationRequest:
    """Test POST /api/discover/send_request logic."""

    @pytest.mark.asyncio
    @patch("core.database.execute_query")
    @patch("core.database.execute_update")
    async def test_send_request_success(self, mock_execute_update, mock_execute_query):
        """Test sending a collaboration request succeeds."""
        mock_execute_query.side_effect = [
            [MOCK_SENDER_PROFILE],  # sender profile
            [MOCK_TARGET_PROFILE],  # target profile
            [],  # no existing pending request
        ]

        from api.routes import send_collaboration_request

        result = await send_collaboration_request(
            body={"profile_id": str(MOCK_TARGET_PROFILE["id"]), "message": "Let's collab!"},
            current_user=MOCK_USER,
        )

        assert result["success"] is True
        assert result["to_username"] == "test_videographer_1"
        assert "request_id" in result
        mock_execute_update.assert_called_once()

    @pytest.mark.asyncio
    @patch("core.database.execute_query")
    @patch("core.database.execute_update")
    async def test_send_request_no_message(self, mock_execute_update, mock_execute_query):
        """Test sending a request without an optional message."""
        mock_execute_query.side_effect = [
            [MOCK_SENDER_PROFILE],
            [MOCK_TARGET_PROFILE],
            [],
        ]

        from api.routes import send_collaboration_request

        result = await send_collaboration_request(
            body={"profile_id": str(MOCK_TARGET_PROFILE["id"])},
            current_user=MOCK_USER,
        )

        assert result["success"] is True
        mock_execute_update.assert_called_once()

    @pytest.mark.asyncio
    @patch("core.database.execute_query")
    async def test_send_request_no_profile(self, mock_execute_query):
        """Test sending a request without a user profile."""
        mock_execute_query.return_value = []

        from api.routes import send_collaboration_request

        result = await send_collaboration_request(
            body={"profile_id": str(MOCK_TARGET_PROFILE["id"])},
            current_user=MOCK_USER,
        )

        assert result["success"] is False
        assert "create a profile" in result.get("error", "").lower()

    @pytest.mark.asyncio
    @patch("core.database.execute_query")
    async def test_send_request_target_not_found(self, mock_execute_query):
        """Test sending a request to a non-existent profile."""
        mock_execute_query.side_effect = [
            [MOCK_SENDER_PROFILE],
            [],
        ]

        from api.routes import send_collaboration_request

        result = await send_collaboration_request(
            body={"profile_id": str(uuid.uuid4())},
            current_user=MOCK_USER,
        )

        assert result["success"] is False
        assert "not found" in result.get("error", "").lower()

    @pytest.mark.asyncio
    @patch("core.database.execute_query")
    async def test_send_request_self(self, mock_execute_query):
        """Test sending a request to yourself is rejected."""
        mock_execute_query.side_effect = [
            [MOCK_SENDER_PROFILE],
            [MOCK_SENDER_PROFILE],  # same profile as sender
        ]

        from api.routes import send_collaboration_request

        result = await send_collaboration_request(
            body={"profile_id": str(MOCK_SENDER_PROFILE["id"])},
            current_user=MOCK_USER,
        )

        assert result["success"] is False
        assert "cannot send" in result.get("error", "").lower()

    @pytest.mark.asyncio
    @patch("core.database.execute_query")
    async def test_send_request_duplicate(self, mock_execute_query):
        """Test duplicate pending request is rejected."""
        mock_execute_query.side_effect = [
            [MOCK_SENDER_PROFILE],
            [MOCK_TARGET_PROFILE],
            [{"id": uuid.uuid4(), "status": "pending"}],  # existing pending request
        ]

        from api.routes import send_collaboration_request

        result = await send_collaboration_request(
            body={"profile_id": str(MOCK_TARGET_PROFILE["id"])},
            current_user=MOCK_USER,
        )

        assert result["success"] is False
        assert "already have a pending" in result.get("error", "").lower()

    @pytest.mark.asyncio
    @patch("core.database.execute_query")
    async def test_send_request_missing_profile_id(self, mock_execute_query):
        """Test request without profile_id fails."""
        from api.routes import send_collaboration_request

        result = await send_collaboration_request(
            body={},
            current_user=MOCK_USER,
        )

        assert result["success"] is False
        assert "profile_id is required" in result.get("error", "").lower()


class TestGetMyRequests:
    """Test GET /api/discover/my_requests logic."""

    FROZEN_TIME = datetime(2025, 6, 1, 12, 0, 0)

    def _make_request(self, **overrides):
        """Helper to create a mock request row."""
        return {
            "id": uuid.uuid4(),
            "from_user_id": MOCK_SENDER_PROFILE["id"],
            "from_username": "test_artist",
            "to_profile_id": MOCK_TARGET_PROFILE["id"],
            "to_username": "test_videographer_1",
            "message": "Let's work together!",
            "status": "pending",
            "created_at": self.FROZEN_TIME,
            "responded_at": None,
            **overrides,
        }

    @pytest.mark.asyncio
    @patch("core.database.execute_query")
    async def test_get_requests_with_data(self, mock_execute_query):
        """Test fetching requests returns incoming and outgoing arrays."""
        incoming = [self._make_request(status="pending")]
        outgoing = [self._make_request(
            from_user_id=MOCK_TARGET_PROFILE["id"],
            from_username="test_videographer_1",
            to_profile_id=MOCK_SENDER_PROFILE["id"],
            to_username="test_artist",
        )]

        mock_execute_query.side_effect = [
            [MOCK_SENDER_PROFILE],  # profile lookup
            incoming,  # incoming requests
            outgoing,  # outgoing requests
        ]

        from api.routes import get_my_collaboration_requests

        result = await get_my_collaboration_requests(current_user=MOCK_USER)

        assert result["success"] is True
        assert len(result["incoming"]) == 1
        assert len(result["outgoing"]) == 1
        assert result["incoming"][0]["status"] == "pending"
        assert result["incoming"][0]["from_username"] == "test_artist"
        assert result["outgoing"][0]["to_username"] == "test_artist"

    @pytest.mark.asyncio
    @patch("core.database.execute_query")
    async def test_get_requests_empty(self, mock_execute_query):
        """Test fetching requests when there are none."""
        mock_execute_query.side_effect = [
            [MOCK_SENDER_PROFILE],
            [],
            [],
        ]

        from api.routes import get_my_collaboration_requests

        result = await get_my_collaboration_requests(current_user=MOCK_USER)

        assert result["success"] is True
        assert result["incoming"] == []
        assert result["outgoing"] == []

    @pytest.mark.asyncio
    @patch("core.database.execute_query")
    async def test_get_requests_no_profile(self, mock_execute_query):
        """Test fetching requests without a profile."""
        mock_execute_query.return_value = []

        from api.routes import get_my_collaboration_requests

        result = await get_my_collaboration_requests(current_user=MOCK_USER)

        assert result["success"] is False
        assert "no profile found" in result.get("error", "").lower()

    @pytest.mark.asyncio
    @patch("core.database.execute_query")
    async def test_get_requests_with_mixed_statuses(self, mock_execute_query):
        """Test fetching requests with pending, accepted, and declined entries."""
        incoming = [
            self._make_request(status="pending"),
            self._make_request(status="accepted", responded_at=self.FROZEN_TIME),
            self._make_request(status="declined", responded_at=self.FROZEN_TIME),
        ]

        mock_execute_query.side_effect = [
            [MOCK_SENDER_PROFILE],
            incoming,
            [],
        ]

        from api.routes import get_my_collaboration_requests

        result = await get_my_collaboration_requests(current_user=MOCK_USER)

        assert result["success"] is True
        assert len(result["incoming"]) == 3
        statuses = [r["status"] for r in result["incoming"]]
        assert "pending" in statuses
        assert "accepted" in statuses
        assert "declined" in statuses

    @pytest.mark.asyncio
    @patch("core.database.execute_query")
    async def test_get_requests_with_messages(self, mock_execute_query):
        """Test that message field is properly serialized."""
        incoming = [self._make_request(status="pending", message="Hey, love your work!")]

        mock_execute_query.side_effect = [
            [MOCK_SENDER_PROFILE],
            incoming,
            [],
        ]

        from api.routes import get_my_collaboration_requests

        result = await get_my_collaboration_requests(current_user=MOCK_USER)

        assert result["success"] is True
        assert result["incoming"][0]["message"] == "Hey, love your work!"


class TestRespondToRequest:
    """Test POST /api/discover/respond_request logic."""

    @pytest.mark.asyncio
    @patch("core.database.execute_query")
    @patch("core.database.execute_update")
    async def test_accept_request(self, mock_execute_update, mock_execute_query):
        """Test accepting a collaboration request."""
        request_id = uuid.uuid4()
        req_row = {
            "id": request_id,
            "from_user_id": MOCK_SENDER_PROFILE["id"],
            "from_username": "test_artist",
            "to_profile_id": MOCK_TARGET_PROFILE["id"],
            "to_username": "test_videographer_1",
            "message": "Let's collab!",
            "status": "pending",
            "created_at": datetime(2025, 6, 1, 12, 0, 0),
            "responded_at": None,
        }

        mock_execute_query.side_effect = [
            [MOCK_TARGET_PROFILE],  # profile lookup (recipient = target)
            [req_row],  # the request
        ]

        from api.routes import respond_to_collaboration_request

        result = await respond_to_collaboration_request(
            body={"request_id": str(request_id), "action": "accept"},
            current_user=MOCK_USER,
        )

        assert result["success"] is True
        assert result["status"] == "accepted"
        mock_execute_update.assert_called_once()
        args, _ = mock_execute_update.call_args
        # "accepted" is passed as SQL parameter, not in the query string
        assert "accepted" in str(args[1])

    @pytest.mark.asyncio
    @patch("core.database.execute_query")
    @patch("core.database.execute_update")
    async def test_decline_request(self, mock_execute_update, mock_execute_query):
        """Test declining a collaboration request."""
        request_id = uuid.uuid4()
        req_row = {
            "id": request_id,
            "from_user_id": MOCK_SENDER_PROFILE["id"],
            "from_username": "test_artist",
            "to_profile_id": MOCK_TARGET_PROFILE["id"],
            "to_username": "test_videographer_1",
            "message": "Let's collab!",
            "status": "pending",
            "created_at": datetime(2025, 6, 1, 12, 0, 0),
            "responded_at": None,
        }

        mock_execute_query.side_effect = [
            [MOCK_TARGET_PROFILE],
            [req_row],
        ]

        from api.routes import respond_to_collaboration_request

        result = await respond_to_collaboration_request(
            body={"request_id": str(request_id), "action": "decline"},
            current_user=MOCK_USER,
        )

        assert result["success"] is True
        assert result["status"] == "declined"

    @pytest.mark.asyncio
    @patch("core.database.execute_query")
    async def test_respond_unauthorized(self, mock_execute_query):
        """Test responding to a request sent to someone else."""
        request_id = uuid.uuid4()
        req_row = {
            "id": request_id,
            "from_user_id": MOCK_SENDER_PROFILE["id"],
            "from_username": "test_artist",
            "to_profile_id": MOCK_ANOTHER_PROFILE["id"],  # different recipient
            "to_username": "test_videographer_2",
            "message": "Let's collab!",
            "status": "pending",
            "created_at": datetime(2025, 6, 1, 12, 0, 0),
            "responded_at": None,
        }

        mock_execute_query.side_effect = [
            [MOCK_TARGET_PROFILE],  # current user's profile
            [req_row],  # the request (belongs to someone else)
        ]

        from api.routes import respond_to_collaboration_request

        result = await respond_to_collaboration_request(
            body={"request_id": str(request_id), "action": "accept"},
            current_user=MOCK_USER,
        )

        assert result["success"] is False
        assert "not sent to you" in result.get("error", "").lower()

    @pytest.mark.asyncio
    @patch("core.database.execute_query")
    async def test_respond_already_responded(self, mock_execute_query):
        """Test responding to a request that was already handled."""
        request_id = uuid.uuid4()
        req_row = {
            "id": request_id,
            "from_user_id": MOCK_SENDER_PROFILE["id"],
            "from_username": "test_artist",
            "to_profile_id": MOCK_TARGET_PROFILE["id"],
            "to_username": "test_videographer_1",
            "message": "Let's collab!",
            "status": "accepted",  # already accepted
            "created_at": datetime(2025, 6, 1, 12, 0, 0),
            "responded_at": datetime(2025, 6, 1, 12, 30, 0),
        }

        mock_execute_query.side_effect = [
            [MOCK_TARGET_PROFILE],
            [req_row],
        ]

        from api.routes import respond_to_collaboration_request

        result = await respond_to_collaboration_request(
            body={"request_id": str(request_id), "action": "accept"},
            current_user=MOCK_USER,
        )

        assert result["success"] is False
        assert "already" in result.get("error", "").lower()

    @pytest.mark.asyncio
    @patch("core.database.execute_query")
    async def test_respond_request_not_found(self, mock_execute_query):
        """Test responding to a non-existent request."""
        mock_execute_query.side_effect = [
            [MOCK_TARGET_PROFILE],
            [],
        ]

        from api.routes import respond_to_collaboration_request

        result = await respond_to_collaboration_request(
            body={"request_id": str(uuid.uuid4()), "action": "accept"},
            current_user=MOCK_USER,
        )

        assert result["success"] is False
        assert "not found" in result.get("error", "").lower()

    @pytest.mark.asyncio
    async def test_respond_missing_action(self):
        """Test responding without an action."""
        from api.routes import respond_to_collaboration_request

        result = await respond_to_collaboration_request(
            body={"request_id": str(uuid.uuid4())},
            current_user=MOCK_USER,
        )

        assert result["success"] is False
        assert "action" in result.get("error", "").lower()

    @pytest.mark.asyncio
    async def test_respond_invalid_action(self):
        """Test responding with an invalid action."""
        from api.routes import respond_to_collaboration_request

        result = await respond_to_collaboration_request(
            body={"request_id": str(uuid.uuid4()), "action": "maybe"},
            current_user=MOCK_USER,
        )

        assert result["success"] is False
        assert "action" in result.get("error", "").lower()
