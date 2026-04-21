import React from 'react';
import { Device, Alert, Ticket } from '../../types';
import { AlertDetails } from '../features/AlertDetails';
import { SearchEngine } from '../features/SearchEngine';
import { DeviceDashboard } from '../features/DeviceDashboard';
import { TicketDetails } from '../features/TicketDetails';
import { EmptyWorkspace } from './EmptyWorkspace';

interface MainWorkspaceProps {
  activeWorkspace: string;
  searchMode: string;
  selectedAlertId: string;
  selectedTicketId: string;
  alerts: Alert[];
  tickets: Ticket[];
  onReadAlert: (id: string) => void;
  onDeleteAlert: (id: string) => void;
  onDeleteTicket: (id: string) => void;
  activeDevice: Device | undefined;
  waveData: number[];
  score: number;
  latency: string;
  bandwidth: string;
  uptime: string;
  safeOpenRightSidebar: () => void;
  aiPanelOpenRef: React.MutableRefObject<boolean>;
  isPaused: boolean;
  pauseStream: () => void;
  resumeStream: () => void;
  onOpenExport: () => void;
}

export const MainWorkspace: React.FC<MainWorkspaceProps> = ({
  activeWorkspace, searchMode, selectedAlertId, selectedTicketId, alerts, tickets, onReadAlert, onDeleteAlert, onDeleteTicket, activeDevice, waveData, score,
  latency, bandwidth, uptime, safeOpenRightSidebar, aiPanelOpenRef,
  isPaused, pauseStream, resumeStream, onOpenExport
}) => {
   let content: React.ReactNode = null;

   if (activeWorkspace === 'alert-details') {
      if (!alerts.some(a => a.id === selectedAlertId)) {
         content = <EmptyWorkspace />;
      } else {
         content = (
            <AlertDetails 
               selectedAlertId={selectedAlertId} 
               alerts={alerts}
               onReadAlert={onReadAlert}
               onDeleteAlert={onDeleteAlert}
               safeOpenRightSidebar={safeOpenRightSidebar} 
               aiPanelOpenRef={aiPanelOpenRef} 
            />
         );
      }
   } else if (activeWorkspace === 'ticket-details') {
      if (!tickets.some(t => t.id === selectedTicketId)) {
         content = <EmptyWorkspace />;
      } else {
         content = <TicketDetails
            selectedTicketId={selectedTicketId}
            tickets={tickets}
            onDeleteTicket={onDeleteTicket}
            safeOpenRightSidebar={safeOpenRightSidebar}
         />;
      }
   } else if (activeWorkspace === 'search') {
      content = <SearchEngine searchMode={searchMode} />;
   } else {
      if (!activeDevice) {
         content = <EmptyWorkspace />;
      } else {
         content = (
            <DeviceDashboard 
               activeDevice={activeDevice} 
               waveData={waveData} 
               score={score} 
               latency={latency} 
               bandwidth={bandwidth}
               uptime={uptime}
               isPaused={isPaused}
               pauseStream={pauseStream}
               resumeStream={resumeStream}
               onOpenExport={onOpenExport}
            />
         );
      }
   }

  return (
    <div className="flex-1 flex flex-col min-w-0 z-10 relative bg-bg-base">
        {content}
    </div>
  );
};
