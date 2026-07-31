import React from 'react';
import WorkerCard from './WorkerCard';

/**
 * Worker Grid container matching Stitch design system.
 * Renders dynamic worker cards in a responsive 4-column grid.
 */
const WorkerTable = ({ workers = [], onViewDetails, onDownloadSingle, generatingWisa }) => {
  if (workers.length === 0) {
    return (
      <div className="bg-[#122131] p-12 rounded-xl border border-[#45464d]/20 text-center inner-glow my-6">
        <span className="material-symbols-outlined text-[48px] text-[#909097] mb-3">
          person_search
        </span>
        <h3 className="text-lg font-semibold text-[#d4e4fa] mb-1">No Workers Found</h3>
        <p className="text-sm text-[#909097]">
          No worker records match your current search query. Try clearing filters or searching by a different name or WISA ID.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {workers.map((worker) => (
        <WorkerCard
          key={worker.WISA || worker.Name}
          worker={worker}
          onViewDetails={onViewDetails}
          onDownloadSingle={onDownloadSingle}
          isDownloading={generatingWisa === worker.WISA}
        />
      ))}
    </div>
  );
};

export default WorkerTable;
