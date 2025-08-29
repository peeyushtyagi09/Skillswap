import React, { useState } from 'react';
import api from '../../src/api';

export default function CallRatingModal({
  isOpen,
  onClose,
  sessionId,
  peerId,
  callDuration = 0,
  onSubmitSuccess,
}) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [callQuality, setCallQuality] = useState('Good');
  const [issues, setIssues] = useState(['None']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const qualityOptions = ['Excellent', 'Good', 'Fair', 'Poor'];
  const issueOptions = [
    'Audio Issues',
    'Video Issues',
    'Connection Problems',
    'Lag',
    'None',
  ];

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const handleIssueChange = (issue) => {
    if (issue === 'None') {
      setIssues(['None']);
    } else {
      setIssues((prev) => {
        const filtered = prev.filter((i) => i !== 'None');
        if (filtered.includes(issue)) {
          return filtered.filter((i) => i !== issue);
        } else {
          return [...filtered, issue];
        }
      });
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      window?.toast
        ? window.toast.error('Please select a rating')
        : alert('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await api.post(
        '/call-rating/submit',
        {
          sessionId,
          peerId,
          rating,
          feedback,
          callDuration: Math.round(callDuration),
          callQuality,
          issues: issues.length === 0 ? ['None'] : issues,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        window?.toast
          ? window.toast.success('Thank you for your feedback!')
          : alert('Thank you for your feedback!');
        onSubmitSuccess && onSubmitSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      window?.toast
        ? window.toast.error('Failed to submit rating. Please try again.')
        : alert('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <dialog open className="modal modal-open z-50">
      <form
        method="dialog"
        className="modal-box bg-base-100 max-w-lg w-full p-0 overflow-visible"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className="px-8 pt-8 pb-2">
          <div className="flex flex-col items-center mb-6">
            <h3 className="text-2xl font-bold text-primary mb-1">
              Rate Your Call
            </h3>
            <p className="text-base-content/70 text-center">
              How was your video call experience?
            </p>
          </div>

          {/* Rating Stars */}
          <div className="flex flex-col items-center mb-4">
            <div className="rating rating-lg">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <input
                  key={star}
                  type="radio"
                  name="rating-10"
                  className="mask mask-star-2 bg-warning"
                  checked={rating === star}
                  onChange={() => handleRatingChange(star)}
                  aria-label={`${star} star`}
                />
              ))}
            </div>
            <span className="mt-2 text-lg font-semibold text-primary">
              {rating === 0 ? 'Select Rating' : `${rating}/10`}
            </span>
          </div>

          {/* Call Quality */}
          <div className="mb-4">
            <label className="label pb-1">
              <span className="label-text font-semibold">Call Quality</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={callQuality}
              onChange={(e) => setCallQuality(e.target.value)}
            >
              {qualityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Issues */}
          <div className="mb-4">
            <label className="label pb-1">
              <span className="label-text font-semibold">Issues Experienced</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {issueOptions.map((issue) => (
                <label
                  key={issue}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg border cursor-pointer transition
                    ${
                      issues.includes(issue)
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-base-200 border-base-300 text-base-content'
                    }
                  `}
                  style={{ minWidth: 'fit-content' }}
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={issues.includes(issue)}
                    onChange={() => handleIssueChange(issue)}
                  />
                  <span className="text-sm">{issue}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div className="mb-6">
            <label className="label pb-1">
              <span className="label-text font-semibold">
                Additional Feedback <span className="text-xs text-base-content/60">(Optional)</span>
              </span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full resize-none"
              placeholder="Share your experience..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-right text-base-content/50 mt-1">
              {feedback.length}/500
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="modal-action px-8 pb-8 pt-0 flex gap-3">
          <button
            type="button"
            className="btn btn-outline flex-1"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              'Submit Rating'
            )}
          </button>
        </div>
      </form>
      <form method="dialog" className="modal-backdrop">
        <button aria-label="Close" onClick={onClose}></button>
      </form>
    </dialog>
  );
}