import { useState } from 'react';
import { notifyError } from '../../../shared/lib/notify';
import { menuExportService, type MenuExportEntity, type MenuExportFormat } from '../services/menu-export.service';

/** Plain (non-react-query) hook: each call is a one-off file download, not cached state. */
export function useExportMenu() {
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  async function download(entity: MenuExportEntity, format: MenuExportFormat) {
    const key = `${entity}-${format}`;
    setDownloadingKey(key);
    try {
      await menuExportService.download(entity, format);
    } catch {
      notifyError(undefined, `Failed to export ${entity}`);
    } finally {
      setDownloadingKey(null);
    }
  }

  return { download, downloadingKey };
}
