import { useEffect, useState } from "react";
import { api } from "../lib/api";

function ReportCard({ review }) {
  const monthLabel = new Date(review.periodStart).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-[#12161D] rounded-xl p-5 mb-3">
      <div className="flex justify-between items-start mb-3">
        <p className="text-sm font-semibold text-white">{monthLabel}</p>
        <span className="text-[10px] text-[#565B64]">
          Generated{" "}
          {new Date(review.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <div>
          <p className="text-[10px] text-[#565B64] mb-1">Commits</p>
          <p className="text-sm text-white font-medium">
            {review.totalCommits}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[#565B64] mb-1">Active Days</p>
          <p className="text-sm text-white font-medium">{review.activeDays}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#565B64] mb-1">PRs Merged</p>
          <p className="text-sm text-white font-medium">{review.prsMerged}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#565B64] mb-1">Issues Closed</p>
          <p className="text-sm text-white font-medium">
            {review.issuesClosed}
          </p>
        </div>
      </div>

      <p className="text-xs text-[#9095A0] leading-relaxed">
        {review.aiSummary ?? "No written review for this period."}
      </p>
    </div>
  );
}

export default function Reports() {
  const [reviews, setReviews] = useState(null);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  function load() {
    api.monthlyReview
      .all()
      .then((d) => setReviews(d.reviews))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    try {
      await api.monthlyReview.generate();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  if (error) return <div className="p-8 text-red-400 text-sm">{error}</div>;
  if (!reviews)
    return <div className="p-8 text-[#8A8F99] text-sm">Loading...</div>;

  return (
    <div className="p-6 md:p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Reports</h1>
          <p className="text-xs text-[#8A8F99]">
            Your monthly reviews, archived.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="text-xs bg-[#151A21] text-[#C9CDD3] px-3 py-2 rounded-lg disabled:opacity-50"
        >
          {generating ? "Generating..." : "✨ Generate for this month"}
        </button>
      </div>

      {reviews.length === 0 && (
        <p className="text-sm text-[#565B64]">No reviews generated yet.</p>
      )}
      {reviews.map((review) => (
        <ReportCard key={review.id} review={review} />
      ))}
    </div>
  );
}
