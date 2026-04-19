export interface SidebarMenuItem {
  permissionCode: string;
  label: string;
}

export interface SidebarMenuGroup {
  groupId: string;
  groupLabel: string;
  items: SidebarMenuItem[];
}

export interface RoleSidebarMenuState {
  groups: SidebarMenuGroup[];
  selectedPermissionCodes: string[];
}

export interface RoleSidebarMenuUpdatePayload {
  permissionCodes: string[];
}
