"""Sentry configuration and initialization."""
import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.sqlalchemy import SqlAlchemyIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
from loguru import logger


def init_sentry():
    """Initialize Sentry SDK with appropriate configuration."""
    sentry_dsn = os.getenv("SENTRY_DSN")
    environment = os.getenv("ENVIRONMENT", "development")
    release = os.getenv("RELEASE_VERSION", "unknown")
    
    if not sentry_dsn:
        logger.warning("SENTRY_DSN not configured, skipping Sentry initialization")
        return
    
    # Configure Sentry integrations
    integrations = [
        FastApiIntegration(auto_enabling_integrations=False),
        RedisIntegration(),
        SqlAlchemyIntegration(),
        LoggingIntegration(
            level=None,  # Capture all log levels
            event_level=None  # Don't send logs as events by default
        ),
    ]
    
    # Initialize Sentry
    sentry_sdk.init(
        dsn=sentry_dsn,
        environment=environment,
        release=release,
        integrations=integrations,
        traces_sample_rate=0.1 if environment == "production" else 1.0,
        profiles_sample_rate=0.1 if environment == "production" else 1.0,
        send_default_pii=False,  # Don't send personally identifiable information
        attach_stacktrace=True,
        before_send=before_send_filter,
        before_send_transaction=before_send_transaction_filter,
    )
    
    logger.info(f"Sentry initialized for environment: {environment}")


def before_send_filter(event, hint):
    """Filter events before sending to Sentry."""
    # Don't send health check errors
    if event.get('request', {}).get('url', '').endswith('/health'):
        return None
    
    # Don't send 404 errors for static assets
    if event.get('request', {}).get('url', '').startswith('/static/'):
        return None
    
    # Add custom tags
    event.setdefault('tags', {})
    event['tags']['component'] = 'magiclens-api'
    
    return event


def before_send_transaction_filter(event, hint):
    """Filter transaction events before sending to Sentry."""
    # Don't track health check transactions
    if event.get('transaction', '').endswith('/health'):
        return None
    
    return event


def capture_exception_with_context(exception, **context):
    """Capture exception with additional context."""
    with sentry_sdk.push_scope() as scope:
        # Add context to the scope
        for key, value in context.items():
            scope.set_context(key, value)
        
        sentry_sdk.capture_exception(exception)


def capture_message_with_context(message, level="info", **context):
    """Capture message with additional context."""
    with sentry_sdk.push_scope() as scope:
        # Add context to the scope
        for key, value in context.items():
            scope.set_context(key, value)
        
        sentry_sdk.capture_message(message, level=level)


def set_user_context(user_id=None, wallet_address=None, **extra):
    """Set user context for Sentry."""
    sentry_sdk.set_user({
        "id": user_id,
        "wallet_address": wallet_address,
        **extra
    })


def set_render_context(render_id, video_id=None, status=None, **extra):
    """Set render job context for Sentry."""
    sentry_sdk.set_context("render_job", {
        "render_id": render_id,
        "video_id": video_id,
        "status": status,
        **extra
    })


def add_breadcrumb(message, category="custom", level="info", data=None):
    """Add a breadcrumb to the current scope."""
    sentry_sdk.add_breadcrumb(
        message=message,
        category=category,
        level=level,
        data=data or {}
    )