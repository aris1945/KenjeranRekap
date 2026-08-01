/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, Image as ImageIcon, Plus, Eye, X } from 'lucide-react';

interface EvidenceUploaderProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({
  photos = [],
  onChange,
  maxPhotos = 10,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  // Helper to compress image on client-side before storing as dataURL
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Export as JPEG with 0.8 quality
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files: File[] = Array.from(e.target.files);
    const availableSlots = maxPhotos - photos.length;
    const filesToProcess = files.slice(0, availableSlots);

    const newCompressedPhotos: string[] = [];
    for (const file of filesToProcess) {
      try {
        const compressed = await compressImage(file);
        newCompressedPhotos.push(compressed);
      } catch (err) {
        console.error('Gagal memproses gambar:', err);
      }
    }

    onChange([...photos, ...newCompressedPhotos]);
    if (e.target) e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-3 w-full bg-slate-50 p-4 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-sky-600" />
            Foto Evidence Lapangan ({photos.length}/{maxPhotos})
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Foto ODP, Redaman, Perangkat (ONT/STB), Dropcore, atau Lokasi Pelanggan
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Kamera HP direct capture */}
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={photos.length >= maxPhotos}
            className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kamera</span>
          </button>

          {/* Upload Galeri */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photos.length >= maxPhotos}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Galeri</span>
          </button>
        </div>
      </div>

      {/* Grid foto thumbnails */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-1">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm transition-all hover:shadow-md"
            >
              <img
                src={photo}
                alt={`Evidence ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPreview(photo)}
                  className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg shadow cursor-pointer transition-all"
                  title="Lihat Foto"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(index)}
                  className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow cursor-pointer transition-all"
                  title="Hapus Foto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <span className="absolute bottom-1.5 left-1.5 bg-slate-900/70 text-white text-[10px] font-mono px-1.5 py-0.5 rounded backdrop-blur-sm">
                Foto #{index + 1}
              </span>
            </div>
          ))}

          {photos.length < maxPhotos && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-sky-500 bg-white/60 hover:bg-sky-50/50 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-sky-600 transition-all cursor-pointer"
            >
              <Plus className="w-6 h-6" />
              <span className="text-[10px] font-bold">Tambah Foto</span>
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-5 border-2 border-dashed border-slate-200 hover:border-sky-400 bg-white rounded-xl text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all hover:bg-sky-50/30"
        >
          <div className="p-2.5 bg-sky-50 rounded-full text-sky-600">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">Belum ada foto evidence</p>
            <p className="text-[11px] text-slate-400">
              Klik di sini atau tombol Kamera/Galeri untuk melampirkan bukti foto (Otomatis terkirim ke Telegram)
            </p>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {selectedPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-3xl w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
            <button
              type="button"
              onClick={() => setSelectedPreview(null)}
              className="absolute top-3 right-3 p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full transition-all cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={selectedPreview} alt="Preview Evidence" className="w-full h-auto max-h-[80vh] object-contain mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
};
