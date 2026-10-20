import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileText, Download, FolderOpen, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';
import { getCompetitionStudyMaterials } from '../../api/competitionApi';
import SkeletonCard from '../common/SkeletonCard';

export default function CompetitionStudyMaterialsPage() {
  const { currentCompetition } = useOutletContext();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentCompetition?.id) return;
    loadMaterials();
  }, [currentCompetition]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const res = await getCompetitionStudyMaterials(currentCompetition.id);
      setMaterials(res?.data || []);
    } catch (err) {
      console.error('Failed to load study materials:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!currentCompetition) {
    return (
      <div className="p-8 text-center text-slate-500 font-semibold text-xs">
        No registered competition selected.
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold mb-2">
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Learning Resources</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Study Materials & Handouts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Curated preparation sheets, worksheets, sample question banks, and notes for <span className="font-bold text-slate-800">{currentCompetition.title || currentCompetition.name}</span>.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-3 max-w-lg mx-auto shadow-xs">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-800">No Study Materials Yet</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Academy instructors are currently compiling and formatting the practice sets and handouts for this competition. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((item, idx) => (
            <div
              key={item.id || idx}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold mt-1">
                    {item.fileName || 'Resource Document'} {item.fileType ? `(${item.fileType.toUpperCase()})` : ''}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {item.viewUrl ? (
                  <a
                    href={item.viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                  >
                    <span>Download</span>
                    <Download className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400">Link pending</span>
                )}
                {item.viewUrl && (
                  <a
                    href={item.viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-slate-600 p-1"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
