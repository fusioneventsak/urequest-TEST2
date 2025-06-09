import React, { useState } from 'react';
import { X, Music4, AlertTriangle } from 'lucide-react';
import type { Song, User } from '../types';

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song;
  onSubmit: (data: any) => Promise<boolean>;
  currentUser: User;
}

export function RequestModal({
  isOpen,
  onClose,
  song,
  onSubmit,
  currentUser
}: RequestModalProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate user data
      if (!currentUser.name) {
        throw new Error('User name is required');
      }

      // Enhanced photo size validation for smartphone support
      if (currentUser.photo && currentUser.photo.startsWith('data:')) {
        const base64Length = currentUser.photo.length - (currentUser.photo.indexOf(',') + 1);
        const size = (base64Length * 3) / 4;
        
        // Updated to 1MB limit to support smartphone photos after compression
        const maxSize = 1024 * 1024; // 1MB
        if (size > maxSize) {
          throw new Error(`Your profile photo is too large (${Math.round(size/1024)}KB). Please go back and update your profile with a smaller image (max ${Math.round(maxSize/1024)}KB).`);
        }
      }
      
      // Ensure message is properly trimmed and truncated
      const truncatedMessage = message.trim().slice(0, 100);
      
      const requestData = {
        title: song.title,
        artist: song.artist || '',
        requestedBy: currentUser.name,
        userPhoto: currentUser.photo,
        message: truncatedMessage,
        userId: currentUser.id || currentUser.name
      };

      console.log("Submitting request with data:", requestData);
      
      const success = await onSubmit(requestData);

      if (success) {
        setMessage('');
        onClose();
      } else {
        throw new Error('Failed to submit request. Please try again.');
      }
    } catch (error) {
      console.error('Error in request modal:', error);
      
      let errorMessage = 'Failed to submit request. Please try again.';
      
      if (error instanceof Error) {
        // Check for specific error types
        if (error.message.includes('rate limit')) {
          errorMessage = 'Too many requests. Please try again later.';
        } else if (error.message.includes('duplicate')) {
          errorMessage = 'This song has already been requested.';
        } else if (error.message.includes('photo is too large')) {
          errorMessage = error.message;
        } else if (error.message.includes('User name is required')) {
          errorMessage = 'Please provide your name before submitting a request.';
        } else if (error.message.includes('already requested')) {
          errorMessage = error.message;
        } else if (error.message.includes('Missing required fields')) {
          errorMessage = 'Please ensure all required information is provided.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-effect rounded-lg p-6 w-full max-w-lg">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold text-white mb-6">Request Song</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3 mb-6 flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex items-start space-x-4 mb-6">
          {song.albumArtUrl ? (
            <img 
              src={song.albumArtUrl} 
              alt={`${song.title} album art`}
              className="w-16 h-16 rounded-lg object-cover neon-border"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const musicIcon = e.currentTarget.nextElementSibling as HTMLElement;
                if (musicIcon) musicIcon.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`w-16 h-16 rounded-lg neon-border bg-neon-purple/20 flex items-center justify-center ${song.albumArtUrl ? 'hidden' : 'flex'}`}
          >
            <Music4 className="w-8 h-8 text-neon-purple" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{song.title}</h3>
            {song.artist && (
              <p className="text-gray-300 text-sm truncate">{song.artist}</p>
            )}
            {song.genre && (
              <p className="text-gray-400 text-xs">{song.genre}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-neon-purple/10 border border-neon-purple/20">
            <img 
              src={currentUser.photo} 
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-neon-purple/50"
              onError={(e) => {
                // Fallback to default avatar on error
                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";
              }}
            />
            <div className="flex-1">
              <p className="text-white font-medium">{currentUser.name}</p>
              <p className="text-gray-400 text-sm">Requesting as</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Add a message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Any special notes for this request..."
              className="w-full px-3 py-2 bg-darker-purple/50 border border-neon-purple/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-neon-purple resize-none"
              rows={3}
              maxLength={100}
            />
            <p className="text-xs text-gray-400 mt-1">
              {message.length}/100 characters
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 neon-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </span>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </form>

        {/* Enhanced photo support notice */}
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-md">
          <p className="text-blue-300 text-xs">
            📱 Your profile supports high-quality photos from all smartphone cameras (iPhone, Samsung, Google Pixel, etc.). 
            All images are automatically compressed for optimal performance.
          </p>
        </div>
      </div>
    </div>
  );
}