import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Loader2, Sparkles, Check, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadsApi } from '../../services/api';

export interface UploadedPhoto {
  id?: number | string;
  imageUrl: string;
  title?: string;
  caption?: string;
  memoryDate?: string;
}

interface PhotoUploaderProps {
  photos: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
  onDirectUpload?: (file: File) => Promise<UploadedPhoto | void>;
  onDirectDelete?: (photo: UploadedPhoto) => Promise<void>;
  maxPhotos?: number;
}

export default function PhotoUploader({
  photos,
  onChange,
  onDirectUpload,
  onDirectDelete,
  maxPhotos = 30,
}: PhotoUploaderProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      toast.error(isAr ? 'يرجى اختيار ملفات صور صالحة فقط' : 'Please select valid image files only');
      return;
    }

    if (photos.length + fileArray.length > maxPhotos) {
      toast.error(
        isAr
          ? `الحد الأقصى للصور هو ${maxPhotos} صورة`
          : `Maximum photos limit is ${maxPhotos}`
      );
      return;
    }

    setUploadingCount(prev => prev + fileArray.length);

    for (const file of fileArray) {
      try {
        if (onDirectUpload) {
          await onDirectUpload(file);
        } else {
          // Standard upload to server endpoint
          const res = await uploadsApi.upload(file);
          if (res.data?.url) {
            const newPhoto: UploadedPhoto = {
              id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              imageUrl: res.data.url,
              title: '',
              caption: '',
            };
            onChange([...photos, newPhoto]);
            // update local reference for subsequent files in this batch
            photos.push(newPhoto);
          }
        }
      } catch (err: any) {
        console.error('Photo upload error:', err);
        toast.error(
          (isAr ? 'فشل رفع الصورة: ' : 'Failed to upload photo: ') + (file.name || '')
        );
      } finally {
        setUploadingCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = async (index: number) => {
    const target = photos[index];
    if (onDirectDelete && target) {
      try {
        await onDirectDelete(target);
      } catch (err) {
        return; // error handled by caller
      }
    }
    const updated = photos.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleUpdate = (index: number, field: 'title' | 'caption', value: string) => {
    const updated = photos.map((p, i) => (i === index ? { ...p, [field]: value } : p));
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-300 group ${
          isDragging
            ? 'border-pink-500 bg-pink-500/10 scale-[1.01]'
            : 'border-white/20 bg-white/5 hover:border-pink-500/50 hover:bg-white/[0.07]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={e => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = ''; // Reset input so same file can be re-selected if needed
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500/30 to-purple-500/30 flex items-center justify-center text-pink-400 group-hover:scale-110 group-hover:bg-pink-500/40 transition-all shadow-lg shadow-pink-500/10">
            {uploadingCount > 0 ? (
              <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>

          <div>
            <p className="text-white font-semibold text-lg">
              {uploadingCount > 0
                ? isAr
                  ? `جاري رفع ${uploadingCount} من الصور...`
                  : `Uploading ${uploadingCount} photo(s)...`
                : isAr
                ? 'اضغط هنا لرفع الصور أو اسحبها وأفلتها'
                : 'Click to upload photos or drag & drop here'}
            </p>
            <p className="text-white/40 text-sm mt-1">
              {isAr
                ? 'يدعم JPG, PNG, WEBP, GIF (يمكنك اختيار عدة صور معاً)'
                : 'Supports JPG, PNG, WEBP, GIF (Multiple files supported)'}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>
              {photos.length} / {maxPhotos} {isAr ? 'صورة مرفوعة' : 'photos uploaded'}
            </span>
          </div>
        </div>
      </div>

      {/* Uploaded Photos Gallery Preview */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-pink-400" />
              <span>{isAr ? 'الصور المرفوعة' : 'Uploaded Photos'} ({photos.length})</span>
            </h3>
            <span className="text-white/40 text-xs">
              {isAr ? 'يمكنك كتابة عنوان أو تعليق لكل صورة' : 'You can add titles and captions'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence>
              {photos.map((photo, index) => (
                <motion.div
                  key={photo.id || photo.imageUrl || index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card p-3 rounded-2xl flex gap-3 border border-white/10 hover:border-pink-500/30 transition-all relative group"
                >
                  {/* Thumbnail */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-black/40 border border-white/10">
                    <img
                      src={photo.imageUrl}
                      alt={photo.title || 'Memory photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1 start-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                      #{index + 1}
                    </div>
                  </div>

                  {/* Inputs for Title and Caption */}
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={photo.title || ''}
                        onChange={e => handleUpdate(index, 'title', e.target.value)}
                        placeholder={isAr ? 'عنوان الذكرى (مثال: أول لقاء)' : 'Title (e.g. First Date)'}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-pink-500/50"
                      />
                      <input
                        type="text"
                        value={photo.caption || ''}
                        onChange={e => handleUpdate(index, 'caption', e.target.value)}
                        placeholder={isAr ? 'تعليق أو مكان الذكرى...' : 'Caption or location...'}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-pink-500/50"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleRemove(index)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isAr ? 'حذف' : 'Remove'}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Empty State Help */}
      {photos.length === 0 && (
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
          <p className="text-white/40 text-sm">
            {isAr
              ? '📸 لم تقم برفع أي صور حتى الآن. أضف صوركما معاً لتظهر في ألبوم الذكريات الساحر!'
              : '📸 No photos uploaded yet. Add photos of you two to make a magical memory gallery!'}
          </p>
        </div>
      )}
    </div>
  );
}
