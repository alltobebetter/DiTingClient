import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Clock, FileText, Trash2 } from 'lucide-react';
import { Ticket } from '../../types';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

interface TicketDetailsProps {
   selectedTicketId: string;
   tickets: Ticket[];
   onDeleteTicket: (id: string) => void;
   safeOpenRightSidebar: () => void;
}

export const TicketDetails: React.FC<TicketDetailsProps> = ({ selectedTicketId, tickets, onDeleteTicket }) => {
   const ticket = tickets.find(t => t.id === selectedTicketId);

   if (!ticket) return null;

   return (
      <div className="flex flex-col h-full bg-bg-base overflow-hidden">
         {/* Sticky Header */}
         <div className="shrink-0 h-14 border-b border-border flex items-center justify-between px-6 bg-bg-panel/50 backdrop-blur-sm z-10 shadow-sm">
            <div className="flex items-center space-x-4">
               <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shadow-sm">
                  <FileText size={16} strokeWidth={2} />
               </div>
               <div>
                  <h2 className="text-[14px] font-bold tracking-wider text-text-primary uppercase flex items-center space-x-2">
                     <span>{ticket.title}</span>
                     <span className="text-[9px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded border border-blue-500/20">AGENT GENERATED</span>
                  </h2>
                  <div className="flex items-center space-x-3 mt-0.5 font-mono text-[10px] text-text-secondary opacity-70">
                     <span className="flex items-center"><Clock size={10} className="mr-1" /> {new Date(ticket.timestamp).toLocaleString()}</span>
                     <span>|</span>
                     <span>ID: {ticket.id}</span>
                  </div>
               </div>
            </div>

            <div className="flex items-center space-x-3">
               <button 
                 onClick={() => onDeleteTicket(ticket.id)}
                 className="flex items-center space-x-2 px-3 py-1.5 bg-bg-active hover:bg-red-500/10 border border-border hover:border-red-500/30 rounded-lg text-[11px] font-semibold text-text-secondary hover:text-red-500 transition-colors group"
               >
                 <Trash2 size={13} className="text-text-secondary group-hover:text-red-500 transition-colors" />
                 <span>删除工单</span>
               </button>
            </div>
         </div>

         {/* Scrollable Markdown Content */}
         <OverlayScrollbarsComponent 
            className="flex-1 w-full"
            options={{ scrollbars: { autoHide: 'scroll' } }} 
         >
            <div className="p-8 max-w-4xl mx-auto w-full">
               <div className="markdown-body [&>h1:first-child]:mt-0 text-text-primary">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                     {ticket.content}
                  </ReactMarkdown>
               </div>
               <div className="mt-8 text-center text-[10px] text-text-secondary font-mono opacity-50 select-none pb-8">
                  -- END OF AUTOMATED REPORT --
               </div>
            </div>
         </OverlayScrollbarsComponent>
      </div>
   );
};
