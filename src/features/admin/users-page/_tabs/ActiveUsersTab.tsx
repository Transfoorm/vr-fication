/**──────────────────────────────────────────────────────────────────────┐
│  👥 ACTIVE USERS FEATURE                                              │
│  /src/features/admin/UsersTabs/ActiveUsersTab/index.tsx               │
│                                                                       │
│  VR Doctrine: Feature Layer                                           │
│  - Wires FUSE (user state, admin data)                                │
│  - Handles all callbacks and transforms                               │
│  - The sponge that absorbs all dirt                                   │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState, useMemo, useRef } from 'react';
import { Search, Table, Badge, Modal, Stack } from '@/vr';
import { useSideDrawer } from '@/vr/modal';
import { useTableSearch } from '@/vr/table';
import type { SortableColumn } from '@/vr/table/Sortable';
import type { RankType } from '@/vr/badge/Rank';
import type { SetupStatusType } from '@/vr/badge/Setup';
import { useVanish } from '@/features/vanish/VanishContext';
import { useAdminData } from '@/hooks/useAdminData';
import { useFuse } from '@/store/fuse';
import { UserDetailsFeature } from '@/features/admin/user-drawer';

type UserData = Record<string, unknown> & { id: string };

export function ActiveUsersTab() {
  const [checkedRows, setCheckedRows] = useState<Set<string>>(new Set());

  // 🚀 WARP: Instant data access from FUSE store (server-preloaded)
  const { data } = useAdminData();
  const users = data.users;
  const { openDrawer: openVanishDrawer } = useVanish();
  const { openDrawer } = useSideDrawer();

  // Get current user for self-deletion protection
  const fuseUser = useFuse((state) => state.user);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'info' | 'success' | 'warning' | 'error';
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info'
  });

  // Ref to hold filtered data for header checkbox (avoids circular dependency)
  const filteredDataRef = useRef<UserData[]>([]);
  const isFilteredRef = useRef(false);

  // Toggle select all filtered rows / clear selections
  // Only allows select-all when search is active (prevents bulk deletion of entire database)
  const handleHeaderCheckbox = () => {
    if (checkedRows.size > 0) {
      // Clear all selections
      setCheckedRows(new Set());
    } else if (isFilteredRef.current) {
      // Select all filtered rows (excluding self - can't delete yourself)
      const allIds = filteredDataRef.current
        .map(row => row.id)
        .filter(id => id !== fuseUser?.id);
      setCheckedRows(new Set(allIds));
    }
    // If not filtered, do nothing - prevents selecting entire database
  };

  const handleRowCheckbox = (id: string) => {
    setCheckedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleViewUser = (row: UserData) => {
    const setupStatus = row.setupStatus as SetupStatusType;
    const isComplete = setupStatus === 'complete';
    openDrawer({
      content: <UserDetailsFeature userId={row.id} />,
      title: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
      subtitle: isComplete
        ? row.email as string
        : <>{row.email} <Badge.setup status={setupStatus} /></>
    });
  };

  const handleDeleteUser = (row: UserData) => {
    openVanishDrawer({ target: row.id }, (result) => {  // row.id is the Convex _id
      if (result.success) {
        const deletedUser = result.deletedUsers?.[0];
        const userName = deletedUser?.name && deletedUser.name.trim() !== '-' && deletedUser.name.trim() !== ''
          ? deletedUser.name
          : '';
        setModalState({
          isOpen: true,
          title: 'Success',
          message: `User ${userName ? userName + ' - ' : ''}${deletedUser?.email || ''} was successfully deleted`,
          variant: 'success'
        });
      } else {
        const errorMsg = result.errors && result.errors.length > 0
          ? `\n\n${result.errors[0]}`
          : '';
        setModalState({
          isOpen: true,
          title: 'Deletion Failed',
          message: `Failed to delete user${errorMsg}`,
          variant: 'error'
        });
      }
    });
  };

  // Handler for batch deleting users
  const handleBatchDelete = () => {
    // Filter out self (can't delete yourself)
    const userIds = Array.from(checkedRows).filter(id => id !== fuseUser?.id);
    if (userIds.length === 0) return;

    openVanishDrawer({ targets: userIds }, (result) => {
      if (result.success) {
        const count = result.deletedUsers?.length || userIds.length;
        setModalState({
          isOpen: true,
          title: 'Success',
          message: `Successfully deleted ${count} user${count === 1 ? '' : 's'}`,
          variant: 'success'
        });
        setCheckedRows(new Set());
      } else {
        const errorMsg = result.errors && result.errors.length > 0
          ? `\n\n${result.errors[0]}`
          : '';
        setModalState({
          isOpen: true,
          title: 'Batch Deletion Failed',
          message: `Failed to delete users${errorMsg}`,
          variant: 'error'
        });
      }
    });
  };

  // Column definitions (needed before useTableSearch)
  const columns: SortableColumn<UserData>[] = [
    { key: 'select', variant: 'checkbox', checked: checkedRows, onCheck: handleRowCheckbox, onHeaderCheck: handleHeaderCheckbox, getRowLabel: (row) => `${row.firstName}`, disableCheckbox: (row) => row.id === fuseUser?.id, checkboxTooltip: (row) => row.id === fuseUser?.id ? "You cannot delete yourself" : undefined, headerTooltip: "You can't select the entire database for deletion", tooltipSize: 'sm', sortable: false },
    { key: 'createdAt', header: 'Created', sortable: true, width: '11%' },
    { key: 'email', header: 'Email', sortable: true, width: '17%' },
    { key: 'setupStatus', header: 'Setup', sortable: true, width: '10%', render: (_value, row) => <Badge.setup status={row.setupStatus as SetupStatusType} /> },
    { key: 'firstName', header: 'First', sortable: true, width: '9%' },
    { key: 'lastName', header: 'Last', sortable: true, width: '12%' },
    { key: 'entityName', header: 'Entity', sortable: true, width: '12%' },
    { key: 'socialName', header: 'Social', sortable: true, width: '12%' },
    { key: 'rank', header: 'Rank', sortable: true, width: '10%', render: (_value, row) => <Badge.rank rank={row.rank as RankType} /> },
    { key: 'actions', header: 'Actions', sortable: false, variant: 'view', disableDelete: (row) => row.id === fuseUser?.id, deleteTooltip: (row) => row.id === fuseUser?.id ? "You cannot delete yourself" : "Delete", tooltipSize: 'sm', onView: handleViewUser, onDelete: handleDeleteUser },
  ];

  // Transform raw user data for table display
  const tableData = useMemo(() => users?.map(user => ({
    id: String(user._id),
    createdAt: user.createdAt ? new Date(user.createdAt as number).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—',
    firstName: user.firstName as string,
    lastName: user.lastName as string,
    email: user.email as string,
    setupStatus: user.setupStatus as SetupStatusType,
    entityName: user.entityName as string,
    socialName: user.socialName as string,
    rank: user.rank as RankType
  })) || [], [users]);

  // 🔍 Auto-search: filters all columns except checkbox & actions
  const { searchTerm, setSearchTerm, filteredData, totalCount, resultsCount, isFiltered } = useTableSearch({
    data: tableData,
    columns,
  });

  // Keep refs in sync with filteredData for handleHeaderCheckbox
  filteredDataRef.current = filteredData;
  isFilteredRef.current = isFiltered;

  return (
    <Stack>
      {/* Table.toolbar: Search left, batch actions right - TTT compliant layout */}
      <Table.toolbar
        search={
          <Search.bar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search users..."
            resultsCount={resultsCount}
            totalCount={totalCount}
          />
        }
        actions={
          <Table.batchActions
            selectedCount={checkedRows.size}
            onDelete={handleBatchDelete}
            label="user/users"
          />
        }
      />

      <Table.sortable
        columns={columns}
        data={filteredData}
        defaultSortKey={null}
        striped
        bordered
        isFiltered={isFiltered}
      />

      {modalState.isOpen && (
        <Modal.alert
          isOpen={modalState.isOpen}
          onClose={() => setModalState({ ...modalState, isOpen: false })}
          title={modalState.title}
          message={modalState.message}
          variant={modalState.variant}
        />
      )}
    </Stack>
  );
}
