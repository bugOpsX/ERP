import React from 'react';
import WorkerDetailModal from './WorkerDetailModal';

/**
 * WorkerDetailDrawer
 * Adapter component wrapping WorkerDetailModal to ensure full backward compatibility
 * with App.jsx while displaying the modern large worker attendance workspace.
 */
const WorkerDetailDrawer = (props) => {
  return <WorkerDetailModal {...props} />;
};

export default WorkerDetailDrawer;
