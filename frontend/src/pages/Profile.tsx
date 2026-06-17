import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Plus, X, Shield, Check } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore.js';
import Button from '../components/ui/Button.js';
import Input from '../components/ui/Input.js';
import Avatar from '../components/ui/Avatar.js';

export const Profile: React.FC = () => {
  const { user, updateProfile, isLoading, error, clearError } = useAuthStore();
  
  const [bio, setBio] = useState(user?.bio || '');
  const [interests, setInterests] = useState<string[]>(user?.interests || []);
  const [newTag, setNewTag] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newTag.trim().toUpperCase();
    if (tag && !interests.includes(tag)) {
      setInterests([...interests, tag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setInterests(interests.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = async () => {
    clearError();
    try {
      await updateProfile(bio, interests);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full px-4 md:px-6 py-4 md:py-6 overflow-y-auto overscroll-y-contain max-w-3xl">
      <div className="flex items-center gap-3 mb-4">
        <UserIcon className="w-5 h-5 text-accent" />
        <h1 className="text-sm md:text-lg font-bold tracking-tight text-primaryText uppercase font-mono">PROFILE</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 bg-card/20 border border-border p-4 md:p-6 rounded-2xl"
      >
        <div className="flex items-center gap-5 border-b border-border/60 pb-6">
          <Avatar username={user.username} size="lg" />
          <div>
            <h2 className="font-mono text-lg font-bold text-primaryText">
              &gt; {user.username}
            </h2>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              <Shield className="w-3.5 h-3.5 text-accent animate-pulse" />
              STATUS: ACTIVE PROFILE
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-secondaryText block">
            Bio ({160 - bio.length} characters remaining)
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 160))}
            placeholder="Tell us about yourself..."
            rows={3}
            className="w-full min-h-28 px-4 py-3 rounded-xl bg-card border border-border text-primaryText text-sm transition-all placeholder:text-[#66788f] focus:outline-none focus:border-accent/60 resize-none font-sans"
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-secondaryText block">
              Interests
            </label>
            <div className="flex flex-wrap gap-2 min-h-[44px] p-3 rounded-xl border border-border bg-card/30">
              {interests.length > 0 ? (
                interests.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#1e1e1e] border border-border text-primaryText"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs font-mono text-zinc-600 uppercase tracking-wide py-1">
                  No interests added yet.
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleAddTag} className="flex flex-col sm:flex-row gap-2 max-w-lg">
            <Input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="E.g., Coding"
              className="sm:max-w-[280px]"
            />
            <Button type="submit" variant="secondary" className="px-4">
              <Plus className="w-4.5 h-4.5" />
            </Button>
          </form>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/40 text-red-400 text-xs font-mono">
            ERROR: {error}
          </div>
        )}

        <div className="pt-4 border-t border-border/60 flex items-center gap-4">
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isLoading}
            className="font-mono text-xs uppercase w-full sm:w-auto px-6"
          >
            {saveSuccess ? (
              <span className="flex items-center gap-1.5">
                <Check className="w-4.5 h-4.5" /> SAVED
              </span>
            ) : (
              'SAVE PROFILE'
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
