import logging
from datetime import datetime, timezone, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.models.models import WeeklySnapshot
from sqlalchemy import select, func

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None

# Bolivia timezone (UTC-4, no DST)
BOLIVIA_TZ = timezone(timedelta(hours=-4))


def _now_bolivia() -> datetime:
    """Current datetime in Bolivia timezone."""
    return datetime.now(timezone.utc).astimezone(BOLIVIA_TZ)


async def _auto_definitive_report():
    """
    Called by APScheduler at Saturday 23:59 Bolivia time (UTC-4).
    Finds the last definitive report and generates a new definitive one.
    """
    logger.info("[Scheduler] Saturday 23:59 BO — auto-generating definitive report")

    from app.db.session import _Session
    from app.api.dashboard import _generate_snapshots, _get_week_start

    now_utc = datetime.now(timezone.utc)
    bolivia_now = _now_bolivia()

    async with _Session()() as db:
        # Last definitive report
        last_res = await db.execute(
            select(func.max(WeeklySnapshot.created_at)).filter(
                WeeklySnapshot.is_definitive == True
            )
        )
        last_def = last_res.scalar()

        if last_def is None:
            # Use Bolivia week start, convert to UTC for DB
            period_start = _get_week_start(bolivia_now).astimezone(timezone.utc)
        else:
            period_start = last_def

        result = await _generate_snapshots(db, period_start, now_utc, is_definitive=True)
        logger.info(
            "[Scheduler] Definitive report saved: "
            f"${result.total_sales:.2f} sales, {result.total_repairs} repairs, {result.total_items_sold} items"
        )


def start_scheduler():
    """Start the APScheduler. Called during app lifespan startup."""
    global _scheduler
    if _scheduler is not None:
        return

    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(
        _auto_definitive_report,
        CronTrigger(day_of_week="sat", hour=23, minute=59, timezone="America/La_Paz"),
        id="definitive_weekly_report",
        name="Definitive weekly report every Saturday 23:59 Bolivia",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("[Scheduler] Started — weekly report set for Saturday 23:59 BO (UTC-4)")


def stop_scheduler():
    """Shut down the APScheduler. Called during app lifespan shutdown."""
    global _scheduler
    if _scheduler is None:
        return
    _scheduler.shutdown(wait=False)
    _scheduler = None
    logger.info("[Scheduler] Stopped")
