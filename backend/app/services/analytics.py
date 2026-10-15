import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.models.feedback import Feedback, SentimentResult
from app.models.subject import Subject
from app.schemas.analytics import (
    AnalyticsOverview, SentimentDistribution, RatingDistribution,
    SubjectRatingStat, ThemeCount, TrendPoint
)


class AnalyticsService:
    @staticmethod
    def get_overview(
        db: Session,
        subject_id: Optional[int] = None,
        sentiment: Optional[str] = None,
        min_rating: Optional[int] = None,
        max_rating: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        include_demo: bool = True
    ) -> AnalyticsOverview:
        """
        Compute real-time aggregated metrics directly via SQLAlchemy queries.
        Supports rich multi-criteria filtering across subjects, sentiment, ratings, and time periods.
        """
        # Base query joined with Subject and SentimentResult
        query = db.query(Feedback).join(Subject).outerjoin(SentimentResult)

        # Filters
        if not include_demo:
            query = query.filter(Feedback.is_demo == False)
        if subject_id:
            query = query.filter(Feedback.subject_id == subject_id)
        if sentiment:
            query = query.filter(SentimentResult.predicted_sentiment.ilike(sentiment))
        if min_rating:
            query = query.filter(Feedback.overall_rating >= min_rating)
        if max_rating:
            query = query.filter(Feedback.overall_rating <= max_rating)
        if date_from:
            query = query.filter(Feedback.created_at >= date_from)
        if date_to:
            query = query.filter(Feedback.created_at <= date_to)

        all_feedback = query.all()
        total_count = len(all_feedback)

        # Handle empty dataset cleanly
        if total_count == 0:
            return AnalyticsOverview(
                total_feedback=0,
                avg_overall_rating=0.0,
                avg_teaching_clarity=0.0,
                avg_course_content=0.0,
                avg_practical_sessions=0.0,
                sentiment_distribution=SentimentDistribution(),
                rating_distribution=RatingDistribution(),
                subject_stats=[],
                top_improvement_themes=[],
                top_positive_highlights=[],
                trends=[],
                is_demo_active=False,
                ai_grounded_summary="No feedback records match the current filter criteria."
            )

        # Average rating metrics
        avg_overall = round(sum(f.overall_rating for f in all_feedback) / total_count, 2)
        avg_clarity = round(sum(f.teaching_clarity for f in all_feedback) / total_count, 2)
        avg_content = round(sum(f.course_content for f in all_feedback) / total_count, 2)
        avg_practicals = round(sum(f.practical_sessions for f in all_feedback) / total_count, 2)

        # Sentiment Distribution
        pos_count = 0
        neu_count = 0
        neg_count = 0
        mix_count = 0

        theme_counter: Dict[str, Dict[str, int]] = {
            "improvement": {},
            "positive": {}
        }

        # Rating Distribution
        rating_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}

        # Daily trends grouping
        daily_buckets: Dict[str, Dict[str, Any]] = {}
        has_demo = False

        for f in all_feedback:
            if f.is_demo:
                has_demo = True
            rating_dist[f.overall_rating] = rating_dist.get(f.overall_rating, 0) + 1

            # Day key (YYYY-MM-DD)
            day_str = f.created_at.strftime("%Y-%m-%d")
            if day_str not in daily_buckets:
                daily_buckets[day_str] = {"ratings": [], "pos": 0, "neg": 0}
            daily_buckets[day_str]["ratings"].append(f.overall_rating)

            # Sentiment counts & theme extraction
            sent = f.sentiment.predicted_sentiment if f.sentiment else "Neutral"
            if sent == "Positive":
                pos_count += 1
                daily_buckets[day_str]["pos"] += 1
            elif sent == "Negative":
                neg_count += 1
                daily_buckets[day_str]["neg"] += 1
            elif sent == "Mixed":
                mix_count += 1
            else:
                neu_count += 1

            # Extract theme tags
            if f.sentiment and f.sentiment.themes:
                try:
                    themes_list = json.loads(f.sentiment.themes)
                    bucket_key = "positive" if sent == "Positive" else "improvement"
                    for t in themes_list:
                        theme_counter[bucket_key][t] = theme_counter[bucket_key].get(t, 0) + 1
                except Exception:
                    pass

        sentiment_dist = SentimentDistribution(
            positive=pos_count,
            neutral=neu_count,
            negative=neg_count,
            mixed=mix_count,
            total=total_count,
            positive_percentage=round((pos_count / total_count) * 100, 1),
            neutral_percentage=round((neu_count / total_count) * 100, 1),
            negative_percentage=round((neg_count / total_count) * 100, 1),
            mixed_percentage=round((mix_count / total_count) * 100, 1),
        )

        rating_distribution = RatingDistribution(
            stars_1=rating_dist[1],
            stars_2=rating_dist[2],
            stars_3=rating_dist[3],
            stars_4=rating_dist[4],
            stars_5=rating_dist[5],
            total=total_count
        )

        # Subject-wise statistics
        subject_stats: List[SubjectRatingStat] = []
        # Group by subject
        subject_groups: Dict[int, List[Feedback]] = {}
        for f in all_feedback:
            subject_groups.setdefault(f.subject_id, []).append(f)

        for sub_id, f_list in subject_groups.items():
            first_f = f_list[0]
            cnt = len(f_list)
            pos_cnt = sum(1 for item in f_list if item.sentiment and item.sentiment.predicted_sentiment == "Positive")
            subject_stats.append(
                SubjectRatingStat(
                    subject_id=sub_id,
                    subject_code=first_f.subject.code,
                    subject_name=first_f.subject.name,
                    faculty_name=first_f.subject.faculty_name,
                    feedback_count=cnt,
                    avg_overall=round(sum(x.overall_rating for x in f_list) / cnt, 2),
                    avg_teaching_clarity=round(sum(x.teaching_clarity for x in f_list) / cnt, 2),
                    avg_course_content=round(sum(x.course_content for x in f_list) / cnt, 2),
                    avg_practical_sessions=round(sum(x.practical_sessions for x in f_list) / cnt, 2),
                    positive_ratio=round((pos_cnt / cnt) * 100, 1) if cnt > 0 else 0.0
                )
            )
        subject_stats.sort(key=lambda s: s.avg_overall, reverse=True)

        # Top improvement themes
        top_improvements = [
            ThemeCount(theme=k.replace("_", " ").title(), count=v, sentiment="improvement")
            for k, v in sorted(theme_counter["improvement"].items(), key=lambda x: x[1], reverse=True)[:5]
        ]
        # Top positive highlights
        top_positives = [
            ThemeCount(theme=k.replace("_", " ").title(), count=v, sentiment="positive")
            for k, v in sorted(theme_counter["positive"].items(), key=lambda x: x[1], reverse=True)[:5]
        ]

        # Chronological trends
        trends: List[TrendPoint] = []
        for d in sorted(daily_buckets.keys()):
            b = daily_buckets[d]
            ratings = b["ratings"]
            trends.append(
                TrendPoint(
                    date=d,
                    avg_rating=round(sum(ratings) / len(ratings), 2),
                    count=len(ratings),
                    positive_count=b["pos"],
                    negative_count=b["neg"]
                )
            )

        # Date range strings
        dates = [f.created_at for f in all_feedback]
        date_start = min(dates).strftime("%b %d, %Y")
        date_end = max(dates).strftime("%b %d, %Y")

        # Grounded summary derived purely from computed numbers
        grounded_summary = (
            f"Based on {total_count} verified feedback submissions ({date_start} to {date_end}): "
            f"The overall satisfaction index stands at {avg_overall}/5.00, with {sentiment_dist.positive_percentage}% "
            f"positive sentiment and {sentiment_dist.negative_percentage}% negative sentiment. "
        )
        if top_improvements:
            top_theme_names = ", ".join([t.theme for t in top_improvements[:2]])
            grounded_summary += f"Primary areas signaled for pedagogical improvement are {top_theme_names}. "
        if top_positives:
            top_pos_names = ", ".join([t.theme for t in top_positives[:2]])
            grounded_summary += f"Strongest student satisfaction is noted in {top_pos_names}."

        return AnalyticsOverview(
            total_feedback=total_count,
            avg_overall_rating=avg_overall,
            avg_teaching_clarity=avg_clarity,
            avg_course_content=avg_content,
            avg_practical_sessions=avg_practicals,
            sentiment_distribution=sentiment_dist,
            rating_distribution=rating_distribution,
            subject_stats=subject_stats,
            top_improvement_themes=top_improvements,
            top_positive_highlights=top_positives,
            trends=trends,
            is_demo_active=has_demo,
            date_range_start=date_start,
            date_range_end=date_end,
            ai_grounded_summary=grounded_summary
        )


analytics_service = AnalyticsService()
