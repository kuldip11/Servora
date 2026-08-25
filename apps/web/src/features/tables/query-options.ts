import { queryOptions } from '@tanstack/react-query';
import { tablesService } from './services/tables.service';
import { tableKeys } from './query-keys';

export function tablesQuery() {
  return queryOptions({
    queryKey: tableKeys.list(),
    queryFn: tablesService.list,
  });
}
