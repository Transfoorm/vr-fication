/**──────────────────────────────────────────────────────────────────────┐
│  🗑️ DELETED USERS FEATURE                                            │
│  /src/features/admin/UsersTabs/DeletedUsersTab/index.tsx              │
│                                                                       │
│  VR Doctrine: Feature Layer                                           │
│  - Wires FUSE (admin data, deletion logs)                             │
│  - Handles all callbacks and transforms                               │
│  - The sponge that absorbs all dirt                                   │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { deleteDeletionLogAction } from '@/app/actions/admin-mutations';
import type { Id, Doc } from '@/convex/_generated/dataModel';
import { Table, Badge, Modal, Search, Stack } from '@/prebuilts';
import { useTableSearch } from '@/prebuilts/table';
import type { RankType } from '@/prebuilts/badge/Rank';
import type { SetupStatusType } from '@/prebuilts/badge/Setup';
import type { CascadeStatusType } from '@/prebuilts/badge/Cascade';
import type { SortableColumn } from '@/prebuilts/table/Sortable';
import { useAdminData } from '@/hooks/useAdminData';

type DeletionLog = Doc<"admin_users_DeleteLog">;

export function DeletedUsersFeature() {

  // 🚀 WARP: Instant data access from FUSE store (server-preloaded)
  const { data } = useAdminData();
  const deletionLogsRaw = data.deletionLogs;

  // Pre-format table data (like UsersTab pattern)
  const tableData = useMemo(() => {
    if (!deletionLogsRaw) return [];

    return deletionLogsRaw.map(log => {
      const logData = log as DeletionLog;
      const date = new Date(logData._creationTime);
      const dateStr = date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const timeStr = date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const name = logData.firstName && logData.lastName
        ? `${logData.firstName} ${logData.lastName}`
        : '—';

      return {
        ...logData,
        id: logData._id,  // Add explicit id field for Actions component
        dateDisplay: `${dateStr} ${timeStr}`,
        nameDisplay: name,
        emailDisplay: logData.email || '—',
        recordsDisplay: logData.recordsDeleted || 0
      };
    });
  }, [deletionLogsRaw]);

  // Selection state for deletion logs
  const [selectedLogs, setSelectedLogs] = useState<Set<Id<"admin_users_DeleteLog">>>(new Set());

  // Ref to hold filtered data for header checkbox (avoids circular dependency)
  type FormattedLog = (typeof tableData)[number];
  const filteredDataRef = useRef<FormattedLog[]>([]);
  const isFilteredRef = useRef(false);

  // Modal state for viewing log details
  const [selectedLog, setSelectedLog] = useState<DeletionLog | null>(null);

  // Modal state for confirmations and alerts
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'info' | 'success' | 'warning' | 'error';
    alertMode: boolean;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
    alertMode: false
  });

  // Server action for deleting journal entries (SRB-4 compliant)
  const deleteJournalEntry = deleteDeletionLogAction;

  // Checkbox handlers - allow select-all (Admiral's responsibility, double-check via Vanish)
  const handleHeaderCheckbox = useCallback(() => {
    if (selectedLogs.size > 0) {
      // Clear all selections
      setSelectedLogs(new Set());
    } else {
      // Select all rows (filtered or not - logs don't need database protection)
      setSelectedLogs(new Set(filteredDataRef.current.map(log => log._id)));
    }
  }, [selectedLogs.size]);

  const handleRowCheckbox = useCallback((logId: Id<"admin_users_DeleteLog">) => {
    setSelectedLogs(prev => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  }, []);

  // Handler for deleting single journal entry
  const handleDeleteJournalEntry = useCallback(async (logId: Id<"admin_users_DeleteLog">) => {
    setModalState({
      isOpen: true,
      title: 'Delete VANISH Journal Entry?',
      message: 'This will permanently delete this audit log entry. This action cannot be undone.\n\nAre you sure?',
      variant: 'error',
      alertMode: false,
      onConfirm: async () => {
        try {
          const result = await deleteJournalEntry(logId);
          if (result.success) {
            setModalState({
              isOpen: true,
              title: 'Success',
              message: 'Journal entry deleted successfully',
              variant: 'success',
              alertMode: true
            });
            setSelectedLog(null);
          } else {
            // Handle failure (no exception thrown but success: false)
            setModalState({
              isOpen: true,
              title: 'Error',
              message: `Failed to delete journal entry:\n${'error' in result ? result.error : 'Unknown error'}`,
              variant: 'error',
              alertMode: true
            });
          }
        } catch (error) {
          setModalState({
            isOpen: true,
            title: 'Error',
            message: `Failed to delete journal entry:\n${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: 'error',
            alertMode: true
          });
        }
      }
    });
  }, [deleteJournalEntry]);

  // Handler for bulk deleting journal entries (called by VR with selected IDs)
  const handleBulkDeleteLogs = useCallback(async (logIds: Id<"admin_users_DeleteLog">[]) => {

    setModalState({
      isOpen: true,
      title: 'Delete Selected Journal Entries?',
      message: `This will permanently delete ${logIds.length} audit log ${logIds.length === 1 ? 'entry' : 'entries'}. This action cannot be undone.\n\nAre you sure?`,
      variant: 'error',
      alertMode: false,
      onConfirm: async () => {
        try {
          const results = await Promise.all(
            logIds.map(logId => deleteJournalEntry(logId))
          );

          const successCount = results.filter((r: {success: boolean}) => r.success).length;

          if (successCount === logIds.length) {
            setModalState({
              isOpen: true,
              title: 'Success',
              message: `Successfully deleted ${successCount} journal ${successCount === 1 ? 'entry' : 'entries'}`,
              variant: 'success',
              alertMode: true
            });
            setSelectedLogs(new Set());
          } else {
            setModalState({
              isOpen: true,
              title: 'Partial Success',
              message: `Deleted ${successCount} of ${logIds.length} entries. Some deletions failed.`,
              variant: 'warning',
              alertMode: true
            });
            setSelectedLogs(new Set());
          }
        } catch (error) {
          setModalState({
            isOpen: true,
            title: 'Error',
            message: `Failed to delete journal entries:\n${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: 'error',
            alertMode: true
          });
        }
      }
    });
  }, [deleteJournalEntry]);

  const deletionColumns: SortableColumn<FormattedLog, Id<"admin_users_DeleteLog">>[] = useMemo(() => [
    { key: 'select', variant: 'checkbox', checked: selectedLogs, onCheck: handleRowCheckbox, onHeaderCheck: handleHeaderCheckbox, getRowId: (log) => log._id, getRowLabel: (log) => log.emailDisplay, onBatchDelete: handleBulkDeleteLogs, batchLabel: 'entry/entries', sortable: false },
    { key: 'dateDisplay', header: 'Date', sortable: true, width: '16%' },
    { key: 'nameDisplay', header: 'User', sortable: true, width: '15%' },
    { key: 'emailDisplay', header: 'Email', sortable: true, width: '20%' },
    { key: 'rank', header: 'Rank', sortable: true, render: (_value, row) => <Badge.rank rank={(row.rank || 'crew') as RankType} /> },
    { key: 'setupStatus', header: 'Setup', sortable: true, width: '10%', render: (_value, row) => <Badge.setup status={row.setupStatus as SetupStatusType} /> },
    {
      key: 'status',
      header: 'Cascaded',
      sortable: true,
      render: (_value, row) => {
        // Map DB values to badge values
        const statusMap: Record<string, CascadeStatusType> = {
          'completed': 'success',
          'in_progress': 'running',
          'failed': 'failed'
        };
        return <Badge.cascade status={statusMap[row.status as string] || null} />;
      }
    },
    { key: 'recordsDisplay', header: 'DB', sortable: true, width: '8%', cellAlign: 'center' },
    { key: 'actions', header: 'Actions', sortable: false, variant: 'view', onView: (log) => setSelectedLog(log), onDelete: (log) => handleDeleteJournalEntry(log._id) }
  ], [selectedLogs, handleRowCheckbox, handleHeaderCheckbox, handleBulkDeleteLogs, handleDeleteJournalEntry]);

  // 🔍 Auto-search: filters all columns except checkbox & actions
  const { searchTerm, setSearchTerm, filteredData, totalCount, resultsCount, isFiltered } = useTableSearch({
    data: tableData,
    columns: deletionColumns,
  });

  // Keep refs in sync with filteredData for handleHeaderCheckbox
  filteredDataRef.current = filteredData;
  isFilteredRef.current = isFiltered;

  // Handler for batch delete button click
  const handleBatchDelete = () => {
    const ids = Array.from(selectedLogs);
    if (ids.length > 0) {
      handleBulkDeleteLogs(ids);
    }
  };

  return (
    <Stack>
      {/* Table.toolbar: Search left, batch actions right - TTT compliant layout */}
      <Table.toolbar
        search={
          <Search.bar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search deletion logs..."
            resultsCount={resultsCount}
            totalCount={totalCount}
          />
        }
        actions={
          <Table.batchActions
            selectedCount={selectedLogs.size}
            onDelete={handleBatchDelete}
            label="entry/entries"
          />
        }
      />

      <Table.sortable
        columns={deletionColumns}
        data={filteredData}
        defaultSortKey={null}
        striped
        bordered
        isFiltered={isFiltered}
      />

      {/* VANISH Journal Detail Modal */}
      {selectedLog && (
        <Modal.alert
          isOpen={true}
          onClose={() => setSelectedLog(null)}
          title="VANISH Journal Entry"
          message="Audit trail details"
          details={[
            `Name: ${selectedLog.firstName && selectedLog.lastName ? `${selectedLog.firstName} ${selectedLog.lastName}` : '—'}`,
            `User ID: ${selectedLog.userId}`,
            `Clerk ID: ${selectedLog.clerkId}`,
            `Email: ${selectedLog.email}`,
            ...(selectedLog.entityName ? [`Entity Name: ${selectedLog.entityName}`] : []),
            ...(selectedLog.socialName ? [`Social Name: ${selectedLog.socialName}`] : []),
            '---',
            `Rank: ${selectedLog.rank || 'unknown'}`,
            `Subscription: ${selectedLog.subscriptionStatus || '—'}`,
            `Status: ${selectedLog.status}`,
            `DB Records Deleted: ${selectedLog.recordsDeleted || 0}`,
            '',
            'DB Records:',
            '  1. User Profile (account data)',
            ...(selectedLog.scope?.relatedTables && selectedLog.scope.relatedTables.length > 0
              ? selectedLog.scope.relatedTables.map((t, index) => {
                    // Parse format: "table_name:total (del:X anon:Y pres:Z)"
                    const fullMatch = t.match(/^(.+?):(\d+)\s*\(del:(\d+)\s+anon:(\d+)\s+pres:(\d+)\)/);
                    if (!fullMatch) return `  ${index + 2}. ${t}`;

                    const tableName = fullMatch[1]
                      .replace(/_/g, ' ')
                      .split(' ')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ');
                    const deleted = parseInt(fullMatch[3]);
                    const anonymized = parseInt(fullMatch[4]);
                    const preserved = parseInt(fullMatch[5]);

                    const actions = [];
                    if (deleted > 0) actions.push(`${deleted} deleted`);
                    if (anonymized > 0) actions.push(`${anonymized} anonymized`);
                    if (preserved > 0) actions.push(`${preserved} preserved`);

                    return `  ${index + 2}. ${tableName} (${actions.join(', ')})`;
                  })
              : []
            ),
            ...((selectedLog.scope?.clerkAccount || (selectedLog.scope?.storageFiles && selectedLog.scope.storageFiles.length > 0))
              ? [
                  '',
                  'Other Items Deleted:',
                  ...(selectedLog.scope?.clerkAccount ? ['External Resources:', '  • Clerk Authentication Account'] : []),
                  ...(selectedLog.scope?.storageFiles && selectedLog.scope.storageFiles.length > 0
                    ? [
                        'Storage Files:',
                        ...selectedLog.scope.storageFiles.map((fileId, index) => {
                          const fileName = fileId.includes('avatar') ? 'Avatar' :
                                           fileId.includes('logo') || fileId.includes('brand') ? 'Company Logo' :
                                           'Storage File';
                          return `  ${index + 1}. ${fileName} (${fileId})`;
                        })
                      ]
                    : []
                  )
                ]
              : []
            ),
            '---',
            `Deleted: ${new Date(selectedLog._creationTime).toLocaleString()}`,
            '---',
            `Entry ID: ${selectedLog._id}`,
            ...(selectedLog.reason ? [`Reason: ${selectedLog.reason}`] : [])
          ]}
          variant="info"
        />
      )}

      {/* Confirmation/Alert Modal */}
      {modalState.isOpen && (
        modalState.alertMode ? (
          <Modal.alert
            isOpen={modalState.isOpen}
            onClose={() => setModalState({ ...modalState, isOpen: false })}
            title={modalState.title}
            message={modalState.message}
            variant={modalState.variant}
          />
        ) : (
          <Modal.confirmation
            isOpen={modalState.isOpen}
            onCancel={() => setModalState({ ...modalState, isOpen: false })}
            onConfirm={() => {
              if (modalState.onConfirm) {
                modalState.onConfirm();
              }
              // Don't close here - onConfirm sets the next modal state (success/error)
            }}
            title={modalState.title}
            message={modalState.message}
            variant={modalState.variant === 'error' ? 'danger' : 'default'}
          />
        )
      )}
    </Stack>
  );
}
