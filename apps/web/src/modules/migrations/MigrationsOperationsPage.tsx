import { LegacyInspectionsImportPanel } from './LegacyInspectionsImportPanel';
import { MigrationsPage } from './MigrationsPage';

export function MigrationsOperationsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f6faff 0%, #eef4fb 100%)' }}>
      <MigrationsPage />
      <div style={{ padding: '0 24px 24px', marginTop: -24 }}>
        <LegacyInspectionsImportPanel />
      </div>
    </div>
  );
}
