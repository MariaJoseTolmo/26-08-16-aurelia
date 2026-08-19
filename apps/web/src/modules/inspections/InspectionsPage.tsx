import { AppSidebar } from '../../shared/layout/AppSidebar';
import { DashboardFrameShell } from '../dashboard/components/DashboardSections';
import { InspectionNotificationDeepLinkModal } from './components/InspectionNotificationDeepLinkModal';
import { InspectionsManagementView } from './InspectionsManagementView';

function InspectionsManagementHeader() {
  return (
    <div className="bg-white h-[56px] relative shrink-0 w-full" data-name="Header">
      <div aria-hidden className="absolute border-[#e3e3e3] border-b border-solid inset-0 pointer-events-none" />
      <div className="content-stretch flex items-center pb-px px-[24px] relative size-full">
        <div className="flex flex-col items-start">
          <p className="font-['Inter:Bold',sans-serif] text-[#131313] text-[18px] font-bold leading-[normal] whitespace-nowrap">Gestión de inspecciones</p>
          <p className="font-['Inter:Regular',sans-serif] text-[#646464] text-[12px] font-normal leading-[normal] whitespace-nowrap">35 inspecciones abiertas · ordenadas por urgencia de observaciones</p>
        </div>
      </div>
    </div>
  );
}

export function InspectionsPage() {
  return (
    <div className="relative h-screen w-full overflow-hidden" data-name="Gestion de inspecciones">
      <AppSidebar />
      <DashboardFrameShell
        header={<InspectionsManagementHeader />}
        content={<InspectionsManagementView />}
      />
      <InspectionNotificationDeepLinkModal />
    </div>
  );
}
